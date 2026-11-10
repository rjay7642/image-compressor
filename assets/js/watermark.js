/**
 * ImageCompressor - Watermark Engine
 * Applies crisp, resolution-proportional watermarks with customizable opacity and position.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const applyBtn = document.getElementById("applyBtn");
  const output = document.getElementById("output");
  const watermarkText = document.getElementById("watermarkText");
  const opacity = document.getElementById("opacity");
  const fontSize = document.getElementById("fontSize");
  const position = document.getElementById("position");

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
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!currentImage) {
        handleFile();
        setTimeout(executeWatermark, 200);
      } else {
        executeWatermark();
      }
    });
  }

  function executeWatermark() {
    const img = currentImage;
    if (!img) return;

    const text = (watermarkText && watermarkText.value.trim()) || "© ImageCompressor";
    const baseSize = parseInt(fontSize ? fontSize.value : 32, 10) || 32;
    // Scale font size proportionally for high-resolution images
    const scaleFactor = Math.max(1, img.width / 1200);
    const size = Math.round(baseSize * scaleFactor);

    const alpha = (parseInt(opacity ? opacity.value : 40, 10) || 40) / 100;
    const posVal = position ? position.value : "bottom-right";

    applyBtn.disabled = true;
    applyBtn.textContent = "Applying Watermark...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    ctx.font = `600 ${size}px "Space Grotesk", sans-serif`;
    const metrics = ctx.measureText(text);
    const padding = Math.round(28 * scaleFactor);

    let x = padding;
    let y = size + padding;

    switch (posVal) {
      case "top-right":
        ctx.textBaseline = "alphabetic";
        x = Math.max(padding, canvas.width - metrics.width - padding);
        y = size + padding;
        break;
      case "bottom-left":
        ctx.textBaseline = "alphabetic";
        x = padding;
        y = canvas.height - padding;
        break;
      case "bottom-right":
        ctx.textBaseline = "alphabetic";
        x = Math.max(padding, canvas.width - metrics.width - padding);
        y = canvas.height - padding;
        break;
      case "center":
        ctx.textBaseline = "middle";
        x = Math.max(padding, (canvas.width - metrics.width) / 2);
        y = canvas.height / 2;
        break;
      default:
        ctx.textBaseline = "alphabetic";
        x = padding;
        y = size + padding;
        break;
    }

    // Shadow for high visibility on light AND dark backgrounds
    ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(1, alpha + 0.3)})`;
    ctx.shadowBlur = Math.round(6 * scaleFactor);
    ctx.shadowOffsetX = Math.round(2 * scaleFactor);
    ctx.shadowOffsetY = Math.round(2 * scaleFactor);

    // Subtle outline
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = Math.round(3 * scaleFactor);
    ctx.strokeText(text, x, y);

    // Main text
    ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
    ctx.fillText(text, x, y);

    canvas.toBlob(blob => {
      applyBtn.disabled = false;
      applyBtn.textContent = "Apply Watermark";

      if (!blob) {
        if (window.showToast) window.showToast("Watermark failed", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const sizeKB = (blob.size / 1024).toFixed(1);

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Watermark Applied</h3>
            <span class="badge">Branded</span>
          </div>

          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="Watermarked Preview">
            </div>

            <div class="result-info">
              <div><p>Watermark Text</p><strong>"${text}"</strong></div>
              <div><p>Position</p><strong>${posVal.replace("-", " ").toUpperCase()}</strong></div>
              <div><p>New File Size</p><strong>${sizeKB} KB</strong></div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <a href="${url}" download="${originalFileName}-watermarked.png" class="btn-premium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download Watermarked Image
              </a>
            </div>
          </div>
        </div>
      `;

      if (window.showToast) {
        window.showToast("Watermark applied successfully!", "success");
      }
    }, "image/png", 0.95);
  }
})();
