# save as python/nebula_server.py inside your custom node package
from .nebula_project import setup_routes  # route registrar from node.py

def preload(app=None):
    # ComfyUI calls preload(app) on server start for Python extensions
    try:
        if app is not None:
            setup_routes(app)
        else:
            # Some builds call preload() with no args; try global
            from server import PromptServer
            setup_routes(PromptServer.instance.app)
    except Exception as e:
        print(f"[Nebula] Failed to register /nebula/preview: {e}", flush=True)

