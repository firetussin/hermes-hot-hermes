"""Read-only metrics namespace; Hermes owns authentication and serving."""
import importlib.util
import sys
from pathlib import Path
from fastapi import APIRouter

_name = "hot_hermes_resource_adapter"
if _name not in sys.modules:
    _spec = importlib.util.spec_from_file_location(_name, Path(__file__).resolve().parents[1] / "resources.py")
    _module = importlib.util.module_from_spec(_spec)
    sys.modules[_name] = _module
    _spec.loader.exec_module(_module)

router = APIRouter()

@router.get("/status")
def status():
    return sys.modules[_name].snapshot()
