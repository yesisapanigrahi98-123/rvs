from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings
from app.sandbox.docker_executor import docker_executor


class SandboxManager:
    """
    Coordinates sandbox environments, storage isolation,
    and safe code execution lifecycle.
    """

    def __init__(self):
        self.base_dir = settings.SANDBOX_DATA_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_status(self) -> Dict[str, Any]:
        """Returns health status of the sandbox execution engine."""
        return {
            "docker_available": docker_executor.has_docker,
            "execution_mode": "docker" if docker_executor.has_docker else "subprocess_isolated",
            "timeout_seconds": docker_executor.timeout,
            "sandbox_storage_dir": str(self.base_dir),
            "storage_exists": self.base_dir.exists()
        }

    def execute(self, code: str, timeout: Optional[int] = None) -> Dict[str, Any]:
        """Execute Python code in isolated sandbox."""
        return docker_executor.execute_python_code(code, timeout=timeout)

    def get_file_path(self, relative_path: str) -> Path:
        """Resolve a relative path inside the sandbox directory, preventing traversal."""
        # Clean path of leading slashes
        clean_rel = relative_path.lstrip("/\\")
        resolved = (self.base_dir / clean_rel).resolve()
        if not str(resolved).startswith(str(self.base_dir.resolve())):
            raise ValueError("Path traversal detected outside of sandbox directory")
        return resolved

    def read_file(self, relative_path: str) -> str:
        """Safely read content from sandbox file."""
        path = self.get_file_path(relative_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {relative_path}")
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

    def write_file(self, relative_path: str, content: str) -> str:
        """Safely write content to sandbox file."""
        path = self.get_file_path(relative_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return str(path)


sandbox_manager = SandboxManager()
