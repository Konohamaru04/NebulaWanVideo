import { app } from "../../../scripts/app.js";

function ensureStyles() {
  if (document.getElementById("nebula-live-preview-style")) return;
  const style = document.createElement("style");
  style.id = "nebula-live-preview-style";
  style.textContent = `
    .nebula-live-preview-wrap { width: 100%; }
    .nebula-live-preview-img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 6px;
      background: rgba(0,0,0,0.15);
      min-height: 140px;
      object-fit: contain;
    }
    .nebula-live-preview-meta {
      margin-top: 6px;
      font-size: 12px;
      opacity: 0.85;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nebula-live-preview-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      align-items: center;
    }
    .nebula-live-preview-btn {
      padding: 2px 8px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      background: rgba(255,255,255,0.08);
    }
    .nebula-live-preview-btn:hover { background: rgba(255,255,255,0.12); }
  `;
  document.head.appendChild(style);
}

function pickUi(msg) {
  // ComfyUI sometimes provides ui in msg.ui or msg.output.ui
  if (msg?.ui) return msg.ui;
  if (msg?.output?.ui) return msg.output.ui;
  return null;
}

app.registerExtension({
  name: "NebulaLivePreviewNode",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "NebulaLivePreview") return;

    ensureStyles();

    const origOnNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const r = origOnNodeCreated ? origOnNodeCreated.apply(this, arguments) : undefined;

      const wrap = document.createElement("div");
      wrap.className = "nebula-live-preview-wrap";

      const img = document.createElement("img");
      img.className = "nebula-live-preview-img";
      img.alt = "Nebula live preview";
      wrap.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "nebula-live-preview-meta";
      meta.textContent = "Waiting for project id…";
      wrap.appendChild(meta);

      const row = document.createElement("div");
      row.className = "nebula-live-preview-row";

      const pauseBtn = document.createElement("div");
      pauseBtn.className = "nebula-live-preview-btn";
      pauseBtn.textContent = "Pause";
      row.appendChild(pauseBtn);

      const openBtn = document.createElement("div");
      openBtn.className = "nebula-live-preview-btn";
      openBtn.textContent = "Open latest";
      row.appendChild(openBtn);

      wrap.appendChild(row);

      this.addDOMWidget("nebula_live_preview", "preview", wrap, { serialize: false });

      // state
      let projectId = null;
      let refreshMs = 750;
      let includeSubdirs = true;
      let paused = false;
      let timer = null;
      let lastMtime = null;

      const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };

      const start = () => {
        stop();
        timer = setInterval(async () => {
          if (paused || !projectId) return;

          try {
            const infoUrl = `/nebula/live_info?project_id=${encodeURIComponent(projectId)}&subdirs=${includeSubdirs ? "1" : "0"}&t=${Date.now()}`;
            const infoRes = await fetch(infoUrl);
            if (infoRes.status === 204) {
              meta.textContent = `No images yet (project: ${projectId})`;
              return;
            }
            if (!infoRes.ok) {
              meta.textContent = `Preview info error (${infoRes.status})`;
              return;
            }
            const info = await infoRes.json();
            if (!info?.has_image) {
              meta.textContent = `No images yet (project: ${projectId})`;
              return;
            }

            // Only update image when mtime changes (reduces flicker)
            if (lastMtime !== info.mtime) {
              lastMtime = info.mtime;
              const imgUrl = `/nebula/live_image?project_id=${encodeURIComponent(projectId)}&subdirs=${includeSubdirs ? "1" : "0"}&t=${Date.now()}`;
              img.src = imgUrl;
            }

            const loop = info.loop_dir ? `loop: ${info.loop_dir}` : "";
            meta.textContent = `${info.filename || "latest"} • ${loop} • ${new Date((info.mtime || 0) * 1000).toLocaleTimeString()}`;
          } catch (e) {
            meta.textContent = "Preview error (check console)";
            console.warn("[NebulaLivePreview] polling error", e);
          }
        }, refreshMs);
      };

      pauseBtn.onclick = () => {
        paused = !paused;
        pauseBtn.textContent = paused ? "Resume" : "Pause";
      };

      openBtn.onclick = () => {
        if (!projectId) return;
        const url = `/nebula/live_image?project_id=${encodeURIComponent(projectId)}&subdirs=${includeSubdirs ? "1" : "0"}&t=${Date.now()}`;
        window.open(url, "_blank");
      };

      const origOnExecuted = this.onExecuted;
      this.onExecuted = function (msg) {
        if (origOnExecuted) origOnExecuted.call(this, msg);

        const ui = pickUi(msg);
        if (!ui) return;

        if (ui.nebula_live_error?.[0]) {
          meta.textContent = ui.nebula_live_error[0];
          return;
        }

        if (ui.nebula_live_project_id?.[0]) projectId = ui.nebula_live_project_id[0];
        if (ui.nebula_live_refresh_ms?.[0]) refreshMs = Number(ui.nebula_live_refresh_ms[0]) || 750;
        if (ui.nebula_live_include_subdirs?.[0] !== undefined) includeSubdirs = !!ui.nebula_live_include_subdirs[0];

        if (!projectId) {
          meta.textContent = "Waiting for project id…";
          return;
        }

        meta.textContent = `Live preview armed (project: ${projectId})`;
        start();
      };

      const origOnRemoved = this.onRemoved;
      this.onRemoved = function () {
        stop();
        if (origOnRemoved) origOnRemoved.call(this);
      };

      return r;
    };
  },
});
