from dataclasses import dataclass
from datetime import datetime
import json
import sys
import os


@dataclass
class ToolInput:
    plan: str


@dataclass
class InputData:
    session_id: str
    transcript_path: str
    cwd: str
    permission_mode: str
    hook_event_name: str
    tool_name: str
    tool_input: ToolInput

    @classmethod
    def from_dict(cls, data):
        data["tool_input"] = ToolInput(**data["tool_input"])
        return cls(**data)


try:
    input_data = InputData.from_dict(json.load(sys.stdin))
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
    sys.exit(1)

claude_project_dir = os.getenv("CLAUDE_PROJECT_DIR")
if not claude_project_dir:
    print("Error: CLAUDE_PROJECT_DIR environment variable is not set", file=sys.stderr)
    sys.exit(1)

plan_dir = os.path.join(claude_project_dir, ".claude/plans")
os.makedirs(plan_dir, exist_ok=True)
plan_file = f"plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

with open(os.path.join(plan_dir, plan_file), "w", encoding="utf-8") as f:
    f.write(input_data.tool_input.plan)

sys.exit(0)
