from app.api.routes.firewall import router as firewall_router
from app.api.routes.threats import router as threats_router
from app.api.routes.attacks import router as attacks_router
from app.api.routes.policies import router as policies_router
from app.api.routes.audit import router as audit_router
from app.api.routes.dashboard import router as dashboard_router

__all__ = [
    "firewall_router",
    "threats_router",
    "attacks_router",
    "policies_router",
    "audit_router",
    "dashboard_router"
]
