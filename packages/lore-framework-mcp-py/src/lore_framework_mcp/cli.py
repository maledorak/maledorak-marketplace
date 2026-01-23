"""
Lore Framework CLI

CLI interface for lore-framework-mcp.

Usage:
    lore-framework-mcp set-user <user_id>
    lore-framework-mcp set-user --env
    lore-framework-mcp set-task <task_id>
    lore-framework-mcp show-session
    lore-framework-mcp list-users
    lore-framework-mcp clear-task
    lore-framework-mcp generate-index [--next-only] [--quiet]
"""

import os
import sys
import json
from pathlib import Path

import yaml
import frontmatter

from .server import (
    get_project_dir,
    get_lore_dir,
    get_session_dir,
    load_team,
    generate_current_user_md,
    find_task,
    parse_tasks,
    parse_adrs,
    compute_blocks,
    generate_readme,
    generate_next,
)


def parse_args(argv: list[str]) -> tuple[str, list[str], dict]:
    """Parse command line arguments."""
    args = argv[1:]  # Remove script name
    command = args[0] if args else "help"
    positional = []
    flags = {"env": False, "next_only": False, "quiet": False}

    for i, arg in enumerate(args[1:], 1):
        if arg == "--env":
            flags["env"] = True
        elif arg == "--next-only":
            flags["next_only"] = True
        elif arg in ("--quiet", "-q"):
            flags["quiet"] = True
        elif not arg.startswith("-"):
            positional.append(arg)

    return command, positional, flags


def cmd_set_user(args: list[str], flags: dict) -> int:
    """Set current user from team.yaml."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        print("Error: 0-session/ directory not found", file=sys.stderr)
        return 1

    if flags["env"]:
        user_id = os.environ.get("LORE_SESSION_CURRENT_USER")
        if not user_id:
            print("Error: LORE_SESSION_CURRENT_USER not set", file=sys.stderr)
            return 1
    else:
        if not args:
            print("Usage: lore-framework-mcp set-user <user_id> | --env", file=sys.stderr)
            return 1
        user_id = args[0]

    try:
        team = load_team(session_dir)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    if user_id not in team:
        print(f"Error: User '{user_id}' not found", file=sys.stderr)
        print(f"Available: {', '.join(team.keys())}", file=sys.stderr)
        return 1

    user_data = team[user_id]
    content = generate_current_user_md(user_id, user_data, team)
    (session_dir / "current-user.md").write_text(content)

    if not flags["quiet"]:
        print(f"User: {user_id}")
    return 0


def cmd_set_task(args: list[str], flags: dict) -> int:
    """Set current task by ID."""
    lore_dir = get_lore_dir()
    session_dir = get_session_dir()

    if not session_dir.exists():
        print("Error: 0-session/ directory not found", file=sys.stderr)
        return 1

    if not args:
        print("Usage: lore-framework-mcp set-task <task_id>", file=sys.stderr)
        return 1

    task_id = args[0]
    task_path = find_task(lore_dir, task_id)

    if not task_path:
        print(f"Error: Task {task_id} not found", file=sys.stderr)
        return 1

    current_task_md = session_dir / "current-task.md"
    current_task_json = session_dir / "current-task.json"

    # Remove existing symlink
    if current_task_md.exists() or current_task_md.is_symlink():
        current_task_md.unlink()

    # Create relative symlink
    relative_path = os.path.relpath(task_path, session_dir)
    current_task_md.symlink_to(relative_path)

    # Write task metadata
    task_dir = os.path.relpath(task_path.parent, lore_dir)
    current_task_json.write_text(json.dumps({"id": task_id, "path": task_dir}, indent=2))

    if not flags["quiet"]:
        print(f"Task: {task_id} -> {relative_path}")
    return 0


def cmd_show_session() -> int:
    """Show current session state."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        print("Error: 0-session/ directory not found", file=sys.stderr)
        return 1

    # User
    current_user_md = session_dir / "current-user.md"
    if current_user_md.exists():
        content = current_user_md.read_text()
        for line in content.split("\n"):
            if line.startswith("name:"):
                print(f"User: {line.split(':', 1)[1].strip()}")
                break
    else:
        env_user = os.environ.get("LORE_SESSION_CURRENT_USER")
        if env_user:
            print(f"User: not set (LORE_SESSION_CURRENT_USER={env_user} available)")
        else:
            print("User: not set")

    # Task
    current_task_md = session_dir / "current-task.md"
    if current_task_md.is_symlink():
        target = os.readlink(current_task_md)
        parts = target.split("/")
        for part in parts:
            if part and part[0].isdigit() and "_" in part:
                print(f"Task: {part.split('_')[0]} -> {target}")
                break
    else:
        print("Task: not set")

    return 0


def cmd_list_users() -> int:
    """List available users from team.yaml."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        print("Error: 0-session/ directory not found", file=sys.stderr)
        return 1

    try:
        team = load_team(session_dir)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print("Available users:")
    for user_id, user_data in team.items():
        name = user_data.get("name", user_id)
        role = f" ({user_data['role']})" if user_data.get("role") else ""
        print(f"  {user_id}: {name}{role}")

    return 0


def cmd_clear_task(flags: dict) -> int:
    """Clear current task symlink."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        print("Error: 0-session/ directory not found", file=sys.stderr)
        return 1

    current_task_md = session_dir / "current-task.md"
    current_task_json = session_dir / "current-task.json"

    cleared = False
    if current_task_md.exists() or current_task_md.is_symlink():
        current_task_md.unlink()
        cleared = True
    if current_task_json.exists():
        current_task_json.unlink()
        cleared = True

    if not flags["quiet"]:
        print("Task: cleared" if cleared else "Task: none set")
    return 0


def cmd_generate_index(flags: dict) -> int:
    """Regenerate lore index files."""
    lore_dir = get_lore_dir()

    if not lore_dir.exists():
        print(f"Error: lore/ directory not found at {lore_dir}", file=sys.stderr)
        return 1

    tasks = parse_tasks(lore_dir)
    adrs = parse_adrs(lore_dir)
    blocks = compute_blocks(tasks)

    # Generate next-tasks.md
    next_content = generate_next(tasks, blocks)
    next_path = lore_dir / "0-session" / "next-tasks.md"
    if next_path.parent.exists():
        next_path.write_text(next_content)
        if not flags["quiet"]:
            print(f"Generated {next_path}")

    # Generate README.md (unless --next-only)
    if not flags["next_only"]:
        readme_content = generate_readme(tasks, adrs, blocks)
        readme_path = lore_dir / "README.md"
        readme_path.write_text(readme_content)
        if not flags["quiet"]:
            print(f"Generated {readme_path}")

    return 0


def cmd_help() -> int:
    """Show help message."""
    print("""lore-framework-mcp - CLI and MCP server for Lore Framework

Usage:
  lore-framework-mcp [command] [options]

Commands:
  set-user <id>       Set current user from team.yaml
  set-user --env      Set user from LORE_SESSION_CURRENT_USER env var
  set-task <id>       Set current task by ID
  show-session        Show current session state
  list-users          List available users from team.yaml
  clear-task          Clear current task
  generate-index      Regenerate lore/README.md and next-tasks.md
  help                Show this help message

Options:
  --env               Use LORE_SESSION_CURRENT_USER for set-user
  --next-only         Only generate next-tasks.md (skip README.md)
  --quiet, -q         Suppress output

MCP Server:
  Run without arguments to start the MCP server (stdio transport).
""")
    return 0


def run_cli(argv: list[str]) -> int:
    """Run CLI command."""
    command, args, flags = parse_args(argv)

    commands = {
        "set-user": lambda: cmd_set_user(args, flags),
        "set-task": lambda: cmd_set_task(args, flags),
        "show-session": cmd_show_session,
        "list-users": cmd_list_users,
        "clear-task": lambda: cmd_clear_task(flags),
        "generate-index": lambda: cmd_generate_index(flags),
        "help": cmd_help,
        "--help": cmd_help,
        "-h": cmd_help,
    }

    if command in commands:
        return commands[command]()
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print('Run with "help" for usage information.', file=sys.stderr)
        return 1
