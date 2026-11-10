/**
 * ImageCompressor - Rotate & Flip Engine
 * Supports 90°/180°/270° rotation and horizontal/vertical flipping.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const rotateBtn = document.getElementById("rotateBtn");
  const angleSelect = document.getElementById("angleSelect");
  const flipH = document.getElementById("flipH");
  const flipV = document.getElementById("flipV");
  const output = document.getElementById("output");

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
        renderRotateButtons();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderRotateButtons() {
    let container = document.getElementById("quickRotateButtons");
    if (!container && angleSelect) {
      container = document.createElement("div");
      container.id = "quickRotateButtons";
      container.className = "preset-chips mt-2";
      angleSelect.insertAdjacentElement("afterend", container);
    }

    if (container) {
      container.innerHTML = `
        <span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Quick:</span>
        <button type="button" class="preset-chip" data-angle="90">↻ +90°</button>
        <button type="button" class="preset-chip" data-angle="180">↻ 180°</button>
        <button type="button" class="preset-chip" data-angle="270">↺ -90°</button>
      `;

      container.querySelectorAll(".preset-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          if (angleSelect) {
            angleSelect.value = chip.dataset.angle;
          }
          container.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
        });
      });
    }
  }

  if (rotateBtn) {
    rotateBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!currentImage) {
        handleFile();
        setTimeout(executeRotate, 200);
      } else {
        executeRotate();
      }
    });
  }

  function executeRotate() {
    const img = currentImage;
    if (!img) return;

    const angle = parseInt(angleSelect ? angleSelect.value : 0, 10) || 0;
    const radians = (angle * Math.PI) / 180;
    const isQuarterTurn = Math.abs(angle % 180) === 90;

    rotateBtn.disabled = true;
    rotateBtn.textContent = "Rotating...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = isQuarterTurn ? img.height : img.width;
    canvas.height = isQuarterTurn ? img.width : img.height;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.scale(flipH && flipH.checked ? -1 : 1, flipV && flipV.checked ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    canvas.toBlob(blob => {
      rotateBtn.disabled = false;
      rotateBtn.textContent = "Rotate Image";

      if (!blob) {
        if (window.showToast) window.showToast("Rotation failed", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const sizeKB = (blob.size / 1024).toFixed(1);

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Rotation Complete</h3>
            <span class="badge">${angle}° ${flipH && flipH.checked ? 'Flip H' : ''} ${flipV && flipV.checked ? 'Flip V' : ''}</span>
          </div>

          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="Rotated Preview">
            </div>

            <div class="result-info">
              <div><p>Dimensions</p><strong>${canvas.width} × ${canvas.height}px</strong></div>
              <div><p>Angle</p><strong>${angle} Degrees</strong></div>
              <div><p>Size</p><strong>${sizeKB} KB</strong></div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <a href="${url}" download="${originalFileName}-rotated-${angle}deg.png" class="btn-premium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download Rotated Image
              </a>
            </div>
          </div>
        </div>
      `;

      if (window.showToast) {
        window.showToast(`Rotated by ${angle}°!`, "success");
      }
    }, "image/png", 0.95);
  }
})();
