"""
Lore Framework MCP Server

MCP server and CLI for managing lore/ directory structure.
Provides tools for session management, task tracking, and index generation.
"""

import sys
from .server import mcp, run_server
from .cli import run_cli

__version__ = "1.2.2"


def main():
    """Entry point - detect CLI mode or start MCP server."""
    if len(sys.argv) > 1:
        # CLI mode
        sys.exit(run_cli(sys.argv))
    else:
        # MCP server mode
        run_server()
