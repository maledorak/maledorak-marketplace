"""
Lore Framework MCP Server

Provides MCP tools for session and index management.
"""

import os
import json
from pathlib import Path
from datetime import datetime

import yaml
import frontmatter
from mcp.server.fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("lore-framework")


def get_project_dir() -> Path:
    """Get project directory from env or cwd."""
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))


def get_lore_dir() -> Path:
    """Get lore directory path."""
    return get_project_dir() / "lore"


def get_session_dir() -> Path:
    """Get session directory path."""
    return get_lore_dir() / "0-session"


def load_team(session_dir: Path) -> dict:
    """Load team.yaml file."""
    team_file = session_dir / "team.yaml"
    if not team_file.exists():
        raise FileNotFoundError(f"team.yaml not found at {team_file}")
    with open(team_file, "r") as f:
        return yaml.safe_load(f) or {}


def generate_current_user_md(user_id: str, user_data: dict, team: dict) -> str:
    """Generate current-user.md content."""
    lines = []

    # Frontmatter
    lines.append("---")
    lines.append(f"name: {user_id}")
    if user_data.get("github"):
        lines.append(f"github: {user_data['github']}")
    if user_data.get("role"):
        lines.append(f"role: {user_data['role']}")
    lines.append("---")
    lines.append("")

    # Content
    name = user_data.get("name", user_id)
    lines.append(f"# Current User: {name}")
    lines.append("")

    if user_data.get("focus"):
        lines.append(f"**Focus:** {user_data['focus'].strip()}")
        lines.append("")

    if user_data.get("prompting"):
        lines.append("## Communication Preferences")
        lines.append("")
        lines.append(user_data["prompting"].strip())
        lines.append("")

    if user_data.get("note"):
        lines.append(f"> {user_data['note']}")
        lines.append("")

    # Other team members
    other_members = [(k, v) for k, v in team.items() if k != user_id]
    if other_members:
        lines.append("---")
        lines.append("")
        lines.append("## Rest of Team")
        lines.append("")
        lines.append("| Name | Role |")
        lines.append("|------|------|")
        for member_id, member_data in other_members:
            member_name = member_data.get("name", member_id)
            role = member_data.get("role", "—")
            lines.append(f"| {member_name} | {role} |")
        lines.append("")

    return "\n".join(lines)


def find_task(lore_dir: Path, task_id: str) -> Path | None:
    """Find task file by ID."""
    tasks_dir = lore_dir / "1-tasks"
    task_num = task_id.lstrip("0") or "0"

    for status_dir in ["active", "blocked", "archive", "backlog"]:
        status_path = tasks_dir / status_dir
        if not status_path.exists():
            continue

        for item in status_path.iterdir():
            if item.name.startswith("_"):
                continue

            item_id = item.name.split("_")[0].lstrip("0") or "0"
            if item_id == task_num:
                if item.is_dir():
                    readme = item / "README.md"
                    if readme.exists():
                        return readme
                elif item.suffix == ".md":
                    return item

    return None


# ============================================================================
# MCP Tools
# ============================================================================

@mcp.tool()
def lore_framework_set_user(user_id: str) -> str:
    """Set current user from team.yaml.

    Args:
        user_id: The user ID from team.yaml
    """
    session_dir = get_session_dir()

    if not session_dir.exists():
        return "Error: 0-session/ directory not found. Run lore framework bootstrap first."

    try:
        team = load_team(session_dir)
    except FileNotFoundError as e:
        return f"Error: {e}"

    if user_id not in team:
        available = ", ".join(team.keys())
        return f"Error: User '{user_id}' not found. Available: {available}"

    user_data = team[user_id]
    content = generate_current_user_md(user_id, user_data, team)

    current_user_md = session_dir / "current-user.md"
    current_user_md.write_text(content)

    name = user_data.get("name", user_id)
    return f"User set: {user_id} ({name})"


@mcp.tool()
def lore_framework_set_task(task_id: str) -> str:
    """Set current task by ID (creates symlink to task file).

    Args:
        task_id: The task ID (e.g., "1", "01", "123")
    """
    lore_dir = get_lore_dir()
    session_dir = get_session_dir()

    if not session_dir.exists():
        return "Error: 0-session/ directory not found. Run lore framework bootstrap first."

    task_path = find_task(lore_dir, task_id)
    if not task_path:
        return f"Error: Task {task_id} not found. Check 1-tasks/{{active,blocked,archive,backlog}}/"

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

    return f"Task set: {task_id} -> {relative_path}"


@mcp.tool()
def lore_framework_show_session() -> str:
    """Show current session state (user and task)."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        return "Error: 0-session/ directory not found. Run lore framework bootstrap first."

    lines = []

    # User
    current_user_md = session_dir / "current-user.md"
    if current_user_md.exists():
        content = current_user_md.read_text()
        for line in content.split("\n"):
            if line.startswith("name:"):
                lines.append(f"User: {line.split(':', 1)[1].strip()}")
                break
    else:
        env_user = os.environ.get("LORE_SESSION_CURRENT_USER")
        if env_user:
            lines.append(f"User: not set (LORE_SESSION_CURRENT_USER={env_user} available)")
        else:
            lines.append("User: not set")

    # Task
    current_task_md = session_dir / "current-task.md"
    if current_task_md.is_symlink():
        target = os.readlink(current_task_md)
        parts = target.split("/")
        for part in parts:
            if part and part[0].isdigit() and "_" in part:
                lines.append(f"Task: {part.split('_')[0]} -> {target}")
                break
    else:
        lines.append("Task: not set")

    return "\n".join(lines)


@mcp.tool()
def lore_framework_list_users() -> str:
    """List available users from team.yaml."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        return "Error: 0-session/ directory not found. Run lore framework bootstrap first."

    try:
        team = load_team(session_dir)
    except FileNotFoundError as e:
        return f"Error: {e}"

    lines = ["Available users:", ""]
    for user_id, user_data in team.items():
        name = user_data.get("name", user_id)
        role = f" ({user_data['role']})" if user_data.get("role") else ""
        lines.append(f"- {user_id}: {name}{role}")

    return "\n".join(lines)


@mcp.tool()
def lore_framework_clear_task() -> str:
    """Clear current task symlink."""
    session_dir = get_session_dir()

    if not session_dir.exists():
        return "Error: 0-session/ directory not found. Run lore framework bootstrap first."

    current_task_md = session_dir / "current-task.md"
    current_task_json = session_dir / "current-task.json"

    cleared = False
    if current_task_md.exists() or current_task_md.is_symlink():
        current_task_md.unlink()
        cleared = True
    if current_task_json.exists():
        current_task_json.unlink()
        cleared = True

    return "Task cleared" if cleared else "No task was set"


@mcp.tool()
def lore_framework_generate_index() -> str:
    """Regenerate lore/README.md and 0-session/next-tasks.md from task and ADR frontmatter."""
    lore_dir = get_lore_dir()

    if not lore_dir.exists():
        return f"Error: lore/ directory not found at {lore_dir}"

    tasks = parse_tasks(lore_dir)
    adrs = parse_adrs(lore_dir)
    blocks = compute_blocks(tasks)

    # Generate README.md
    readme_content = generate_readme(tasks, adrs, blocks)
    readme_path = lore_dir / "README.md"
    readme_path.write_text(readme_content)

    # Generate next-tasks.md
    next_content = generate_next(tasks, blocks)
    next_path = lore_dir / "0-session" / "next-tasks.md"
    if next_path.parent.exists():
        next_path.write_text(next_content)

    stats = {
        "active": len([t for t in tasks.values() if t["status"] == "active"]),
        "blocked": len([t for t in tasks.values() if t["status"] == "blocked"]),
        "backlog": len([t for t in tasks.values() if t["status"] == "backlog"]),
        "completed": len([t for t in tasks.values() if t["status"] == "completed"]),
        "adrs": len(adrs),
    }

    return f"""Generated:
- {readme_path}
- {next_path}

Stats: {stats['active']} active, {stats['blocked']} blocked, {stats['backlog']} backlog, {stats['completed']} completed, {stats['adrs']} ADRs"""


# ============================================================================
# Index Generation Helpers
# ============================================================================

def parse_tasks(lore_dir: Path) -> dict:
    """Parse all tasks from 1-tasks/."""
    tasks = {}
    tasks_base = lore_dir / "1-tasks"

    for subdir in ["active", "blocked", "archive", "backlog"]:
        subdir_path = tasks_base / subdir
        if not subdir_path.exists():
            continue

        for item in subdir_path.iterdir():
            if item.name.startswith("_"):
                continue

            task_path = None
            if item.is_file() and item.suffix == ".md":
                task_path = item
            elif item.is_dir():
                readme = item / "README.md"
                if readme.exists():
                    task_path = readme

            if not task_path:
                continue

            # Extract task ID
            if task_path.name == "README.md":
                task_id = task_path.parent.name.split("_")[0]
            else:
                task_id = item.stem.split("_")[0]

            if not task_id.isdigit():
                continue

            try:
                post = frontmatter.load(task_path)
                meta = post.metadata

                if not meta:
                    continue

                status = meta.get("status", "active")
                if subdir == "archive":
                    status = "completed"
                elif subdir == "blocked":
                    status = "blocked"
                elif subdir == "backlog":
                    status = "backlog"

                # Extract blocked_by from history
                blocked_by = []
                history = meta.get("history", [])
                if history and isinstance(history, list) and len(history) > 0:
                    latest = history[-1]
                    if latest.get("status") == "blocked":
                        by = latest.get("by", [])
                        if isinstance(by, list):
                            blocked_by = [str(b) for b in by]
                        elif by:
                            blocked_by = [str(by)]

                tasks[str(meta.get("id", task_id))] = {
                    "id": str(meta.get("id", task_id)),
                    "title": meta.get("title") or extract_title(post.content),
                    "type": meta.get("type", "FEATURE"),
                    "status": status,
                    "path": str(task_path.relative_to(lore_dir.parent)),
                    "blocked_by": blocked_by,
                    "related_adr": meta.get("related_adr", []) or [],
                }
            except Exception:
                pass

    return tasks


def parse_adrs(lore_dir: Path) -> dict:
    """Parse all ADRs from 2-adrs/."""
    adrs = {}
    adr_dir = lore_dir / "2-adrs"

    if not adr_dir.exists():
        return adrs

    for item in adr_dir.glob("*.md"):
        if item.name.startswith("_"):
            continue

        adr_id = item.stem.split("_")[0]

        try:
            post = frontmatter.load(item)
            meta = post.metadata

            if not meta:
                continue

            adrs[str(meta.get("id", adr_id))] = {
                "id": str(meta.get("id", adr_id)),
                "title": meta.get("title") or extract_title(post.content),
                "status": meta.get("status", "proposed"),
                "path": str(item.relative_to(lore_dir.parent)),
                "related_tasks": meta.get("related_tasks", []) or [],
            }
        except Exception:
            pass

    return adrs


def extract_title(content: str) -> str:
    """Extract title from markdown content."""
    for line in content.split("\n"):
        if line.startswith("# "):
            return line[2:].strip()
    return "Untitled"


def compute_blocks(tasks: dict) -> dict:
    """Compute which tasks block other tasks."""
    blocks = {tid: [] for tid in tasks}

    for task in tasks.values():
        for blocker_id in task.get("blocked_by", []):
            if blocker_id in blocks:
                blocks[blocker_id].append(task["id"])

    return blocks


def generate_readme(tasks: dict, adrs: dict, blocks: dict) -> str:
    """Generate lore/README.md content."""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M")

    active_count = len([t for t in tasks.values() if t["status"] == "active"])
    blocked_count = len([t for t in tasks.values() if t["status"] == "blocked"])
    backlog_count = len([t for t in tasks.values() if t["status"] == "backlog"])
    completed_count = len([t for t in tasks.values() if t["status"] == "completed"])
    adr_count = len(adrs)

    sections = [f"""# Lore Index

> Auto-generated on {date_str}. Do not edit manually.
> Use `lore-framework_generate-index` tool to regenerate.

Quick reference for task dependencies, status, and ADR relationships.

## Quick Stats

| Active | Blocked | Backlog | Completed | ADRs |
|:------:|:-------:|:-------:|:---------:|:----:|
| {active_count} | {blocked_count} | {backlog_count} | {completed_count} | {adr_count} |"""]

    # Ready to start
    completed_ids = {t["id"] for t in tasks.values() if t["status"] == "completed"}
    ready = []
    for task in tasks.values():
        if task["status"] not in ["active", "blocked"]:
            continue
        blocked_by = task.get("blocked_by", [])
        if not blocked_by or all(b in completed_ids for b in blocked_by):
            ready.append(task)

    if ready:
        sections.append("\n## Ready to Start\n\nThese tasks have no blockers (or all blockers completed):\n")
        for task in sorted(ready, key=lambda t: t["id"]):
            block_count = len(blocks.get(task["id"], []))
            priority = "**HIGH**" if block_count >= 3 else "medium" if block_count >= 1 else "low"
            sections.append(f"- **Task {task['id']}**: [{task['title']}]({task['path']}) — blocks {block_count} tasks ({priority})")

    # Task status table
    sections.append("\n## Task Status\n")
    sections.append("| ID | Title | Type | Status | Blocked By | Blocks | ADRs |")
    sections.append("|:---|:------|:-----|:-------|:-----------|:-------|:-----|")

    status_order = {"active": 0, "blocked": 1, "backlog": 2, "completed": 3}
    sorted_tasks = sorted(tasks.values(), key=lambda t: (status_order.get(t["status"], 4), t["id"]))

    for task in sorted_tasks:
        blocked_by = ", ".join(task.get("blocked_by", [])) or "—"
        task_blocks = ", ".join(sorted(blocks.get(task["id"], []))) or "—"
        related_adr = ", ".join(str(a) for a in task.get("related_adr", [])) or "—"
        status_display = f"**{task['status']}**" if task["status"] == "active" else task["status"]
        title = task["title"][:35] + "..." if len(task["title"]) > 35 else task["title"]
        sections.append(f"| {task['id']} | [{title}]({task['path']}) | {task['type']} | {status_display} | {blocked_by} | {task_blocks} | {related_adr} |")

    # ADR table
    if adrs:
        sections.append("\n## Architecture Decision Records\n")
        sections.append("| ID | Title | Status | Related Tasks |")
        sections.append("|:---|:------|:-------|:--------------|")
        for adr in sorted(adrs.values(), key=lambda a: a["id"]):
            related = ", ".join(str(t) for t in adr.get("related_tasks", [])) or "—"
            sections.append(f"| {adr['id']} | [{adr['title']}]({adr['path']}) | {adr['status']} | {related} |")

    return "\n".join(sections)


def generate_next(tasks: dict, blocks: dict) -> str:
    """Generate 0-session/next-tasks.md content."""
    completed_ids = {t["id"] for t in tasks.values() if t["status"] == "completed"}
    ready = []
    for task in tasks.values():
        if task["status"] not in ["active", "blocked"]:
            continue
        blocked_by = task.get("blocked_by", [])
        if not blocked_by or all(b in completed_ids for b in blocked_by):
            ready.append(task)

    active_count = len([t for t in tasks.values() if t["status"] == "active"])
    blocked_count = len([t for t in tasks.values() if t["status"] == "blocked"])
    backlog_count = len([t for t in tasks.values() if t["status"] == "backlog"])
    completed_count = len([t for t in tasks.values() if t["status"] == "completed"])

    lines = [
        "# Next Tasks",
        "",
        "> Auto-generated. Use `lore-framework_generate-index` tool to regenerate.",
        "> Full index: [README.md](../README.md)",
        "",
        f"**Active:** {active_count} | **Blocked:** {blocked_count} | **Backlog:** {backlog_count} | **Completed:** {completed_count}",
        "",
    ]

    if ready:
        lines.append("## Ready to Start")
        lines.append("")

        sorted_ready = sorted(ready, key=lambda t: -len(blocks.get(t["id"], [])))
        for task in sorted_ready[:10]:
            block_count = len(blocks.get(task["id"], []))
            priority = " [HIGH]" if block_count >= 3 else ""
            unblocks = f"unblocks {block_count}" if block_count > 0 else "no blockers"
            lines.append(f"- **{task['id']}** [{task['title']}]({task['path']}) — {unblocks}{priority}")
        lines.append("")

    blocked_tasks = [t for t in tasks.values() if t["status"] == "blocked"]
    if blocked_tasks:
        blocked_ids = ", ".join(sorted(t["id"] for t in blocked_tasks))
        lines.append(f"## Blocked ({len(blocked_tasks)})")
        lines.append("")
        lines.append(blocked_ids)
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("Set current task: use `lore-framework_set-task` tool with task ID")
    lines.append("")

    return "\n".join(lines)


def run_server():
    """Run the MCP server."""
    mcp.run()
