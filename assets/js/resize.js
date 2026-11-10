/**
 * ImageCompressor - Image Resizer Engine
 * Supports aspect-ratio lock, custom pixel dimensions, and quick presets.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");
  const lockRatio = document.getElementById("lockRatio");
  const resizeBtn = document.getElementById("resizeBtn");
  const output = document.getElementById("output");

  let originalWidth = 0;
  let originalHeight = 0;
  let aspectRatio = 1;
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
    imageInput.addEventListener("change", handleFileSelect);
  }

  function handleFileSelect() {
    const file = getSelectedFile();
    if (!file) {
      currentImage = null;
      originalWidth = 0;
      originalHeight = 0;
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
        originalWidth = img.width;
        originalHeight = img.height;
        aspectRatio = originalWidth / (originalHeight || 1);

        widthInput.value = originalWidth;
        heightInput.value = originalHeight;

        renderPresets();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Quick Preset Chips (25%, 50%, 75%, Original)
  function renderPresets() {
    let container = document.getElementById("resizePresets");
    if (!container && widthInput) {
      container = document.createElement("div");
      container.id = "resizePresets";
      container.className = "preset-chips mt-2";
      widthInput.closest(".row").insertAdjacentElement("afterend", container);
    }

    if (container) {
      container.innerHTML = `
        <span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Presets:</span>
        <button type="button" class="preset-chip" data-scale="0.25">25%</button>
        <button type="button" class="preset-chip" data-scale="0.5">50%</button>
        <button type="button" class="preset-chip" data-scale="0.75">75%</button>
        <button type="button" class="preset-chip active" data-scale="1.0">Original (100%)</button>
      `;

      container.querySelectorAll(".preset-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          container.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");

          const scale = parseFloat(chip.dataset.scale);
          if (scale && originalWidth && originalHeight) {
            widthInput.value = Math.round(originalWidth * scale);
            heightInput.value = Math.round(originalHeight * scale);
          }
        });
      });
    }
  }

  // Aspect ratio synchronization
  if (widthInput && heightInput && lockRatio) {
    widthInput.addEventListener("input", () => {
      if (lockRatio.checked && aspectRatio > 0) {
        const val = parseFloat(widthInput.value);
        if (!isNaN(val) && val > 0) {
          heightInput.value = Math.round(val / aspectRatio);
        }
      }
    });

    heightInput.addEventListener("input", () => {
      if (lockRatio.checked && aspectRatio > 0) {
        const val = parseFloat(heightInput.value);
        if (!isNaN(val) && val > 0) {
          widthInput.value = Math.round(val * aspectRatio);
        }
      }
    });
  }

  if (resizeBtn) {
    resizeBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please select an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!currentImage) {
        handleFileSelect();
        setTimeout(performResize, 200);
      } else {
        performResize();
      }
    });
  }

  function performResize() {
    const targetW = parseInt(widthInput.value, 10);
    const targetH = parseInt(heightInput.value, 10);

    if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
      if (window.showToast) window.showToast("Please enter valid positive dimensions", "error");
      else alert("Please enter valid positive dimensions");
      return;
    }

    resizeBtn.disabled = true;
    resizeBtn.textContent = "Resizing...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(currentImage, 0, 0, targetW, targetH);

    canvas.toBlob(blob => {
      resizeBtn.disabled = false;
      resizeBtn.textContent = "Resize Image";

      if (!blob) {
        if (window.showToast) window.showToast("Resize failed", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const sizeKB = (blob.size / 1024).toFixed(1);

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Resize Complete</h3>
            <span class="badge">${targetW} × ${targetH}px</span>
          </div>

          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="Resized Preview">
            </div>

            <div class="result-info">
              <div><p>Original Dimensions</p><strong>${originalWidth} × ${originalHeight}px</strong></div>
              <div><p>New Dimensions</p><strong>${targetW} × ${targetH}px</strong></div>
              <div><p>New File Size</p><strong>${sizeKB} KB</strong></div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <a href="${url}" download="${originalFileName}-resized-${targetW}x${targetH}.png" class="btn-premium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download Resized Image
              </a>
            </div>
          </div>
        </div>
      `;

      if (window.showToast) {
        window.showToast(`Resized to ${targetW} × ${targetH}px!`, "success");
      }
    }, "image/png", 0.95);
  }
})();
