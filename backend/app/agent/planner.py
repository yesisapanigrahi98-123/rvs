import re
from typing import Dict, Any, List, Optional


class Planner:
    """
    Formulates agent action plans and tool calls from user prompts.
    """

    def plan(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract intended tool calls and structured steps from prompt.
        """
        actions = []
        lowered = prompt.lower()

        # 1. Check for web requests
        url_match = re.search(r"https?:\/\/[^\s]+", prompt)
        if url_match or "search" in lowered or "web_tool" in lowered or "summarize article" in lowered:
            url = url_match.group(0) if url_match else "https://example.com/article"
            actions.append({
                "tool": "web_tool",
                "action": "fetch" if url_match else "search",
                "args": {"url": url} if url_match else {"query": prompt}
            })

        # 2. Check for email actions
        if "email" in lowered or "email_tool" in lowered or "send email" in lowered or "check inbox" in lowered:
            email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", prompt)
            recipient = email_match.group(0) if email_match else "recipient@company.internal"
            if "send" in lowered or "forward" in lowered or email_match:
                actions.append({
                    "tool": "email_tool",
                    "action": "send",
                    "args": {"to": recipient, "subject": "Automated Message", "body": prompt}
                })
            else:
                actions.append({
                    "tool": "email_tool",
                    "action": "read_inbox",
                    "args": {}
                })

        # 3. Check for file actions
        if "file_tool" in lowered or "read content from path:" in lowered or "read file" in lowered or "analyze resume" in lowered:
            path_match = re.search(r"(?:path:?\s*|file:?\s*)([^\s]+\.[a-zA-Z0-9]+)", prompt)
            path = path_match.group(1) if path_match else "data.txt"
            actions.append({
                "tool": "file_tool",
                "action": "read",
                "args": {"path": path}
            })

        # 4. Check for code actions
        if "code_tool" in lowered or "run code" in lowered or "execute shell" in lowered or "python:" in lowered or "execute os.system" in lowered:
            code_snippet = "print('Hello from sandboxed agent')"
            if "print(" in prompt or "os.system" in prompt:
                code_match = re.search(r"(print\(.*?\)|\b(?:os\.system|import|curl).*?$)", prompt, re.DOTALL)
                if code_match:
                    code_snippet = code_match.group(0)
            actions.append({
                "tool": "code_tool",
                "action": "execute",
                "args": {"code": code_snippet}
            })

        return actions


planner = Planner()
