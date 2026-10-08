from app.tools.email_tool import email_tool, EmailTool
from app.tools.web_tool import web_tool, WebTool
from app.tools.file_tool import file_tool, FileTool
from app.tools.code_tool import code_tool, CodeTool

TOOL_REGISTRY = {
    email_tool.name: email_tool,
    web_tool.name: web_tool,
    file_tool.name: file_tool,
    code_tool.name: code_tool,
}

__all__ = [
    "email_tool", "EmailTool",
    "web_tool", "WebTool",
    "file_tool", "FileTool",
    "code_tool", "CodeTool",
    "TOOL_REGISTRY"
]
