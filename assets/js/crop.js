/**
 * ImageCompressor - Image Crop Engine
 * Features coordinate-based cropping with smart presets (Square 1:1, 16:9, 4:3, 9:16, Center 50%).
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const cropBtn = document.getElementById("cropBtn");
  const output = document.getElementById("output");
  const xInput = document.getElementById("cropX");
  const yInput = document.getElementById("cropY");
  const widthInput = document.getElementById("cropWidth");
  const heightInput = document.getElementById("cropHeight");

  let currentImage = null;
  let originalFileName = "image";

  function getSelectedFile() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(imageInput);
      if (list && list.length > 0) return list[0];
    }
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      return imageInput.files[0];
    }
    return null;
  }

  if (imageInput) {
    imageInput.addEventListener("change", handleFile);
  }

  function handleFile() {
    const file = getSelectedFile();
    if (!file) {
      currentImage = null;
      if (output) output.innerHTML = "";
      return;
    }

    originalFileName = file.name.replace(/\.[^/.]+$/, "");
    if (output) output.innerHTML = "";

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        xInput.value = 0;
        yInput.value = 0;
        widthInput.value = img.width;
        heightInput.value = img.height;

        renderCropPresets();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderCropPresets() {
    let container = document.getElementById("cropPresets");
    if (!container && widthInput) {
      container = document.createElement("div");
      container.id = "cropPresets";
      container.className = "preset-chips mt-2";
      heightInput.closest(".row").insertAdjacentElement("afterend", container);
    }

    if (container && currentImage) {
      container.innerHTML = `
        <span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Presets:</span>
        <button type="button" class="preset-chip active" data-preset="full">Full Image</button>
        <button type="button" class="preset-chip" data-preset="square">1:1 Square</button>
        <button type="button" class="preset-chip" data-preset="16-9">16:9 Landscape</button>
        <button type="button" class="preset-chip" data-preset="9-16">9:16 Story</button>
        <button type="button" class="preset-chip" data-preset="center50">Center 50%</button>
      `;

      container.querySelectorAll(".preset-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          container.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          applyPreset(chip.dataset.preset);
        });
      });
    }
  }

  function applyPreset(preset) {
    if (!currentImage) return;
    const w = currentImage.width;
    const h = currentImage.height;

    switch (preset) {
      case "square": {
        const side = Math.min(w, h);
        xInput.value = Math.round((w - side) / 2);
        yInput.value = Math.round((h - side) / 2);
        widthInput.value = Math.round(side);
        heightInput.value = Math.round(side);
        break;
      }
      case "16-9": {
        let cropW = w;
        let cropH = Math.round((w * 9) / 16);
        if (cropH > h) {
          cropH = h;
          cropW = Math.round((h * 16) / 9);
        }
        xInput.value = Math.round((w - cropW) / 2);
        yInput.value = Math.round((h - cropH) / 2);
        widthInput.value = Math.round(cropW);
        heightInput.value = Math.round(cropH);
        break;
      }
      case "9-16": {
        let cropH = h;
        let cropW = Math.round((h * 9) / 16);
        if (cropW > w) {
          cropW = w;
          cropH = Math.round((w * 16) / 9);
        }
        xInput.value = Math.round((w - cropW) / 2);
        yInput.value = Math.round((h - cropH) / 2);
        widthInput.value = Math.round(cropW);
        heightInput.value = Math.round(cropH);
        break;
      }
      case "center50": {
        const cropW = Math.round(w * 0.5);
        const cropH = Math.round(h * 0.5);
        xInput.value = Math.round((w - cropW) / 2);
        yInput.value = Math.round((h - cropH) / 2);
        widthInput.value = cropW;
        heightInput.value = cropH;
        break;
      }
      default: {
        xInput.value = 0;
        yInput.value = 0;
        widthInput.value = w;
        heightInput.value = h;
        break;
      }
    }
  }

  if (cropBtn) {
    cropBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!currentImage) {
        handleFile();
        setTimeout(executeCrop, 200);
      } else {
        executeCrop();
      }
    });
  }

  function executeCrop() {
    const img = currentImage;
    if (!img) return;

    let x = Math.max(0, parseInt(xInput.value, 10) || 0);
    let y = Math.max(0, parseInt(yInput.value, 10) || 0);

    if (x >= img.width || y >= img.height) {
      if (window.showToast) window.showToast("Crop coordinates are outside image bounds", "error");
      return;
    }

    const maxWidth = img.width - x;
    const maxHeight = img.height - y;
    const width = Math.min(maxWidth, Math.max(1, parseInt(widthInput.value, 10) || maxWidth));
    const height = Math.min(maxHeight, Math.max(1, parseInt(heightInput.value, 10) || maxHeight));

    cropBtn.disabled = true;
    cropBtn.textContent = "Cropping...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    canvas.toBlob(blob => {
      cropBtn.disabled = false;
      cropBtn.textContent = "Apply Crop";

      if (!blob) {
        if (window.showToast) window.showToast("Crop operation failed", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const sizeKB = (blob.size / 1024).toFixed(1);

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Crop Complete</h3>
            <span class="badge">${width} × ${height}px</span>
          </div>

          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="Cropped Preview">
            </div>

            <div class="result-info">
              <div><p>Cropped Dimensions</p><strong>${width} × ${height}px</strong></div>
              <div><p>Start Coordinates</p><strong>X: ${x}, Y: ${y}</strong></div>
              <div><p>Cropped Size</p><strong>${sizeKB} KB</strong></div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <a href="${url}" download="${originalFileName}-cropped.png" class="btn-premium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download Cropped Image
              </a>
            </div>
          </div>
        </div>
      `;

      if (window.showToast) {
        window.showToast(`Cropped to ${width} × ${height}px!`, "success");
      }
    }, "image/png", 0.95);
  }
})();
