import os
import subprocess
import tempfile
import time
import shutil
from typing import Dict, Any, Optional
from pathlib import Path
from app.core.config import settings


class DockerExecutor:
    """
    Executes code or scripts safely.
    Attempts Docker container isolation if Docker is active;
    otherwise falls back to an environment-scrubbed, timed-out subprocess sandbox.
    """

    def __init__(self, timeout_seconds: int = None):
        self.timeout = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS
        self.has_docker = self._check_docker()

    def _check_docker(self) -> bool:
        """Check if Docker command is available and daemon is running."""
        try:
            res = subprocess.run(
                ["docker", "info"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=3
            )
            return res.returncode == 0
        except Exception:
            return False

    def execute_python_code(self, code: str, timeout: Optional[int] = None) -> Dict[str, Any]:
        """Execute a Python code snippet safely within sandbox boundary."""
        exec_timeout = timeout or self.timeout
        start_time = time.perf_counter()

        if self.has_docker:
            return self._execute_docker(code, exec_timeout, start_time)
        else:
            return self._execute_subprocess(code, exec_timeout, start_time)

    def _execute_docker(self, code: str, timeout: int, start_time: float) -> Dict[str, Any]:
        """Execute in ephemeral isolated Docker container."""
        try:
            cmd = [
                "docker", "run", "--rm",
                "--network", "none",
                "--memory", "128m",
                "--cpus", "0.5",
                "python:3.11-alpine",
                "python", "-c", code
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "exit_code": res.returncode,
                "duration_ms": round(duration_ms, 2),
                "mode": "docker_isolated"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution timed out after {timeout} seconds",
                "exit_code": -1,
                "duration_ms": round((time.perf_counter() - start_time) * 1000.0, 2),
                "mode": "docker_isolated"
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Docker execution error: {str(e)}",
                "exit_code": 1,
                "duration_ms": round((time.perf_counter() - start_time) * 1000.0, 2),
                "mode": "docker_isolated"
            }

    def _execute_subprocess(self, code: str, timeout: int, start_time: float) -> Dict[str, Any]:
        """Execute in scrubbed subprocess sandbox."""
        temp_dir = tempfile.mkdtemp(prefix="ai_sandbox_")
        script_file = Path(temp_dir) / "script.py"

        # Scrub sensitive environment variables
        safe_env = {
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
            "PATH": os.environ.get("PATH", ""),
            "PYTHONPATH": ""
        }

        try:
            with open(script_file, "w", encoding="utf-8") as f:
                f.write(code)

            res = subprocess.run(
                ["python", str(script_file)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=temp_dir,
                env=safe_env
            )
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "exit_code": res.returncode,
                "duration_ms": round(duration_ms, 2),
                "mode": "subprocess_sandboxed"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution timed out after {timeout} seconds",
                "exit_code": -1,
                "duration_ms": round((time.perf_counter() - start_time) * 1000.0, 2),
                "mode": "subprocess_sandboxed"
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Sandbox execution error: {str(e)}",
                "exit_code": 1,
                "duration_ms": round((time.perf_counter() - start_time) * 1000.0, 2),
                "mode": "subprocess_sandboxed"
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


docker_executor = DockerExecutor()
