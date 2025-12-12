import os
from typing import Any, Dict, Optional

from .nebula_project import get_nebula_dir

class NebulaLivePreview:
    """
    Output node that shows a live preview of the latest image saved by the Nebula loopers
    for the given project.

    Connect `project_data` from "Nebula Project Loader" (or the same dict you pass to the loopers).
    The UI will poll a backend endpoint and display the newest saved frame while generation runs.
    """

    @classmethod
    def INPUT_TYPES(cls):
        # ComfyUI uses "required"/"optional" to build UI.
        return {
            "required": {
                "project_data": ("ANY", {"tooltip": "Project dict from Nebula Project Loader (expects key 'id')."}),
            },
            "optional": {
                "refresh_ms": ("INT", {"default": 750, "min": 100, "max": 10000, "step": 50,
                                       "tooltip": "How often (ms) the preview should refresh."}),
                "include_subdirs": ("BOOLEAN", {"default": True,
                                                "tooltip": "Scan loop subfolders inside the project directory."}),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "run"
    CATEGORY = "Nebula"
    OUTPUT_NODE = True

    def run(self, project_data: Any, refresh_ms: int = 750, include_subdirs: bool = True) -> Dict[str, Any]:
        # Resolve project id
        project_id: Optional[str] = None
        if isinstance(project_data, dict):
            project_id = project_data.get("id") or project_data.get("project_id")
        if not project_id:
            # Still render node, but UI will show "missing id"
            return {"ui": {"nebula_live_error": ["project_data missing 'id' / 'project_id'"]}}

        # Compute project_dir to validate it exists (optional)
        try:
            root = get_nebula_dir()
            project_dir = os.path.join(root, str(project_id))
            exists = os.path.isdir(project_dir)
        except Exception:
            exists = False

        return {
            "ui": {
                "nebula_live_project_id": [str(project_id)],
                "nebula_live_refresh_ms": [int(refresh_ms)],
                "nebula_live_include_subdirs": [bool(include_subdirs)],
                "nebula_live_exists": [bool(exists)],
            }
        }
