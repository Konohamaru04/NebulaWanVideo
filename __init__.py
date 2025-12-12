from .nebula_project import NebulaProject
from .nebula_server import preload  
from .single_looper import NebulaSingleLooperI2V
from .dual_looper import NebulaDualLooperI2V
from .nebula_live_preview import NebulaLivePreview

WEB_DIRECTORY = "./js"

NODE_CLASS_MAPPINGS = {
    "NebulaProject": NebulaProject,
    "NebulaI2VSingleLooper": NebulaSingleLooperI2V,
    "NebulaI2VDualLooper": NebulaDualLooperI2V,
    "NebulaLivePreview": NebulaLivePreview,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NebulaProject": "Nebula Project Loader",
    "NebulaI2VSingleLooper": "Nebula I2V Single Model Looper",
    "NebulaI2VDualLooper": "Nebula I2V Dual Model Looper",
    "NebulaLivePreview": "Nebula Live Preview",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY", "preload"]

