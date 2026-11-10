/**
 * ImageCompressor - Image Format Converter Engine
 * Converts between JPG, PNG, and modern WebP formats in-browser.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const formatSelect = document.getElementById("formatSelect");
  const convertBtn = document.getElementById("convertBtn");
  const output = document.getElementById("output");

  let currentImage = null;
  let originalName = "image";

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
      if (output) output.innerHTML = "";
      return;
    }

    originalName = file.name.replace(/\.[^/.]+$/, "");
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

  if (convertBtn) {
    convertBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please select an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!currentImage) {
        handleFileSelect();
        setTimeout(performConvert, 200);
      } else {
        performConvert();
      }
    });
  }

  function performConvert() {
    const img = currentImage;
    if (!img) return;

    const format = formatSelect ? formatSelect.value : "image/webp";
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    // Fill white background for JPEG
    if (format === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    const quality = format === "image/png" ? undefined : 0.92;

    canvas.toBlob(blob => {
      convertBtn.disabled = false;
      convertBtn.textContent = "Convert Image";

      if (!blob) {
        if (window.showToast) window.showToast("Conversion failed", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
      const sizeKB = (blob.size / 1024).toFixed(1);

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Conversion Complete</h3>
            <span class="badge">${ext.toUpperCase()}</span>
          </div>

          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="Converted Preview">
            </div>

            <div class="result-info">
              <div><p>Format</p><strong>${ext.toUpperCase()}</strong></div>
              <div><p>Dimensions</p><strong>${img.width} × ${img.height}px</strong></div>
              <div><p>Output Size</p><strong>${sizeKB} KB</strong></div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <a href="${url}" download="${originalName}.${ext}" class="btn-premium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download Converted Image
              </a>
            </div>
          </div>
        </div>
      `;

      if (window.showToast) {
        window.showToast(`Converted to ${ext.toUpperCase()} (${sizeKB} KB)!`, "success");
      }
    }, format, quality);
  }
})();
