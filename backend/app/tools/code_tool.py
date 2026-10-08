from typing import Dict, Any, Optional
from app.sandbox.sandbox_manager import sandbox_manager


class CodeTool:
    """Tool allowing the agent to execute code snippets inside the isolated sandbox."""

    name = "code_tool"
    description = "Execute Python code snippets inside an isolated sandbox environment."

    def execute(self, script: str = "", code: str = "", timeout: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        payload_code = script or code or kwargs.get("code", "")
        if not payload_code:
            return {"success": False, "error": "No code provided to execute"}

        result = sandbox_manager.execute(payload_code, timeout=timeout)
        return {
            "success": result["success"],
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "exit_code": result["exit_code"],
            "duration_ms": result["duration_ms"],
            "mode": result["mode"]
        }


code_tool = CodeTool()
