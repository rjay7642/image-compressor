/**
 * ImageCompressor - Core Image Compression Engine
 * Features adaptive quality & dimension scaling to accurately meet target KB requirements.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const compressBtn = document.getElementById("compressBtn");
  const output = document.getElementById("output");
  const targetSizeSelect = document.getElementById("targetSize");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");

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

  // Clear previous output when a new file is chosen
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  if (compressBtn) {
    compressBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      const targetKB = parseInt(targetSizeSelect.value, 10);
      compressBtn.disabled = true;
      compressBtn.textContent = "Compressing...";

      if (progressBox) progressBox.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";
      let currentProgress = 10;
      if (progressBar) progressBar.style.width = `${currentProgress}%`;

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let curWidth = img.width;
          let curHeight = img.height;
          let quality = 0.92;
          let attempts = 0;
          const maxAttempts = 25;

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          function attemptCompression() {
            attempts++;
            currentProgress = Math.min(95, currentProgress + 4);
            if (progressBar) progressBar.style.width = `${currentProgress}%`;

            canvas.width = Math.round(curWidth);
            canvas.height = Math.round(curHeight);

            // Fill white background for JPEG conversion
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
              if (!blob) {
                cleanup("Compression failed to generate output.");
                return;
              }

              const sizeKB = blob.size / 1024;

              // Check if condition is met or attempts exhausted
              if (sizeKB <= targetKB || attempts >= maxAttempts || (quality <= 0.12 && curWidth < 320)) {
                finalize(blob, sizeKB, curWidth, curHeight);
              } else {
                // Adaptive adjustment
                if (quality > 0.3) {
                  quality -= 0.08;
                } else {
                  // Downscale dimensions if quality drop is no longer sufficient
                  curWidth *= 0.85;
                  curHeight *= 0.85;
                  quality = 0.55;
                }
                setTimeout(attemptCompression, 16);
              }
            }, "image/jpeg", quality);
          }

          function finalize(blob, finalSizeKB, finalW, finalH) {
            if (progressBar) progressBar.style.width = "100%";
            setTimeout(() => {
              if (progressBox) progressBox.style.display = "none";
            }, 300);

            const origKB = file.size / 1024;
            const savedKB = Math.max(0, origKB - finalSizeKB);
            const savedPercent = origKB > 0 ? Math.round((savedKB / origKB) * 100) : 0;
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const url = URL.createObjectURL(blob);

            output.innerHTML = `
              <div class="result-card">
                <div class="result-header">
                  <h3>Compression Complete</h3>
                  <span class="badge">${savedPercent > 0 ? `-${savedPercent}% Saved` : 'Optimized'}</span>
                </div>

                <div class="result-body">
                  <div class="image-preview">
                    <img src="${url}" alt="Compressed Preview">
                  </div>

                  <div class="result-info">
                    <div>
                      <p>Original Size</p>
                      <strong>${origKB.toFixed(1)} KB</strong>
                    </div>
                    <div>
                      <p>Compressed Size</p>
                      <strong>${finalSizeKB.toFixed(1)} KB</strong>
                    </div>
                    <div>
                      <p>Reduction</p>
                      <strong style="color: #10b981;">-${savedPercent}% (${savedKB.toFixed(1)} KB)</strong>
                    </div>
                    <div>
                      <p>Dimensions</p>
                      <strong>${Math.round(finalW)} × ${Math.round(finalH)}px</strong>
                    </div>
                  </div>

                  <div class="d-flex justify-content-center mt-3">
                    <a href="${url}" download="${baseName}-compressed-${targetKB}kb.jpg" class="btn-premium">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      Download Compressed Image
                    </a>
                  </div>
                </div>
              </div>
            `;

            compressBtn.disabled = false;
            compressBtn.textContent = "Compress Image";

            if (window.showToast) {
              window.showToast(`Compressed to ${finalSizeKB.toFixed(1)} KB!`, "success");
            }
          }

          attemptCompression();
        };

        img.onerror = () => {
          cleanup("Invalid or corrupted image file.");
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        cleanup("Error reading file.");
      };

      reader.readAsDataURL(file);

      function cleanup(errMessage) {
        if (progressBox) progressBox.style.display = "none";
        compressBtn.disabled = false;
        compressBtn.textContent = "Compress Image";
        if (window.showToast) window.showToast(errMessage, "error");
        else alert(errMessage);
      }
    });
  }
})();
