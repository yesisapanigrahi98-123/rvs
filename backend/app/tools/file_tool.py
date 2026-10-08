import os
from typing import Dict, Any, List
from pathlib import Path
from app.sandbox.sandbox_manager import sandbox_manager


class FileTool:
    """Tool allowing the agent to read, write, and list files strictly within the sandbox directory."""

    name = "file_tool"
    description = "Read, write, and list workspace files in the secure sandbox storage."

    def execute(self, action: str = "read", **kwargs) -> Dict[str, Any]:
        path = kwargs.get("path", "")
        if not path:
            return {"success": False, "error": "Missing 'path' parameter"}

        try:
            if action == "read":
                content = sandbox_manager.read_file(path)
                return {"success": True, "path": path, "content": content}
            elif action == "write":
                content = kwargs.get("content", "")
                saved_path = sandbox_manager.write_file(path, content)
                return {"success": True, "path": path, "saved_path": saved_path, "bytes_written": len(content)}
            elif action == "list":
                target_dir = sandbox_manager.get_file_path(path)
                if not target_dir.exists() or not target_dir.is_dir():
                    return {"success": False, "error": f"Directory not found: {path}"}
                files = [f.name for f in target_dir.iterdir()]
                return {"success": True, "dir": path, "files": files}
            else:
                return {"success": False, "error": f"Unknown file action: {action}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


file_tool = FileTool()
