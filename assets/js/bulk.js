/**
 * ImageCompressor - Bulk Image Compressor Engine
 * Batch processes multiple images with adaptive compression and ZIP packaging.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const targetSizeSelect = document.getElementById("targetSize");
  const bulkCompressBtn = document.getElementById("bulkCompressBtn");
  const output = document.getElementById("output");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");

  let zipQueue = []; // Array of { name, blob }

  function getSelectedFiles() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(imageInput);
      if (list && list.length > 0) return list;
    }
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      return Array.from(imageInput.files);
    }
    return [];
  }

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  if (bulkCompressBtn) {
    bulkCompressBtn.addEventListener("click", async () => {
      const files = getSelectedFiles();
      if (!files.length) {
        if (window.showToast) window.showToast("Please select image files first", "error");
        else alert("Please select images first");
        return;
      }

      const targetKB = parseInt(targetSizeSelect.value, 10);
      output.innerHTML = "";
      zipQueue = [];

      bulkCompressBtn.disabled = true;
      bulkCompressBtn.textContent = "Processing Batch...";

      if (progressBox) progressBox.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";

      let completed = 0;
      const total = files.length;
      const usedNames = new Set();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await compressSingleImageAdaptive(file, targetKB);
          completed++;

          const percent = Math.round((completed / total) * 100);
          if (progressBar) progressBar.style.width = `${percent}%`;

          appendResultCard(result, targetKB);

          let zipName = `compressed-${result.cleanName}.jpg`;
          if (usedNames.has(zipName)) {
            zipName = `compressed-${i + 1}-${result.cleanName}.jpg`;
          }
          usedNames.add(zipName);
          zipQueue.push({ name: zipName, blob: result.blob });
        } catch (err) {
          console.error("Failed to compress:", file.name, err);
        }
      }

      setTimeout(() => {
        if (progressBox) progressBox.style.display = "none";
        bulkCompressBtn.disabled = false;
        bulkCompressBtn.textContent = "Bulk Compress Images";
        showZipButton();
        if (window.showToast) {
          window.showToast(`Batch complete: ${completed} images compressed!`, "success");
        }
      }, 300);
    });
  }

  function compressSingleImageAdaptive(file, targetKB) {
    return new Promise(resolve => {
      const reader = new FileReader();
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let curWidth = img.width;
          let curHeight = img.height;
          let quality = 0.9;
          let attempts = 0;
          const maxAttempts = 20;

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          function step() {
            attempts++;
            canvas.width = Math.round(curWidth);
            canvas.height = Math.round(curHeight);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
              if (!blob) {
                resolve({
                  name: file.name,
                  cleanName,
                  origKB: (file.size / 1024).toFixed(1),
                  sizeKB: "0",
                  url: "",
                  blob: new Blob()
                });
                return;
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB <= targetKB || attempts >= maxAttempts || (quality <= 0.15 && curWidth < 300)) {
                resolve({
                  name: file.name,
                  cleanName,
                  origKB: (file.size / 1024).toFixed(1),
                  sizeKB: sizeKB.toFixed(1),
                  url: URL.createObjectURL(blob),
                  blob
                });
              } else {
                if (quality > 0.35) {
                  quality -= 0.1;
                } else {
                  curWidth *= 0.85;
                  curHeight *= 0.85;
                  quality = 0.55;
                }
                setTimeout(step, 10);
              }
            }, "image/jpeg", quality);
          }

          step();
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  function appendResultCard(data, targetKB) {
    const card = document.createElement("div");
    card.className = "result-card";

    const orig = parseFloat(data.origKB) || 0;
    const final = parseFloat(data.sizeKB) || 0;
    const saved = Math.max(0, orig - final);
    const percent = orig > 0 ? Math.round((saved / orig) * 100) : 0;

    card.innerHTML = `
      <div class="result-header">
        <h3 title="${data.name}">${data.name}</h3>
        <span class="badge">-${percent}%</span>
      </div>

      <div class="result-body">
        <div class="result-info">
          <div><p>Original</p><strong>${data.origKB} KB</strong></div>
          <div><p>Compressed</p><strong>${data.sizeKB} KB</strong></div>
          <div><p>Saved</p><strong style="color: #10b981;">${saved.toFixed(1)} KB</strong></div>
        </div>

        <div class="d-flex justify-content-center mt-2">
          <a href="${data.url}" download="compressed-${data.cleanName}.jpg" class="btn-premium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download
          </a>
        </div>
      </div>
    `;

    output.appendChild(card);
  }

  function showZipButton() {
    if (!zipQueue.length || !window.JSZip) return;

    const zipBtn = document.createElement("button");
    zipBtn.className = "btn-premium w-100 mb-4";
    zipBtn.style.padding = "16px 24px";
    zipBtn.style.fontSize = "1.05rem";
    zipBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
      Download All (${zipQueue.length}) as ZIP
    `;

    zipBtn.addEventListener("click", async () => {
      zipBtn.disabled = true;
      zipBtn.textContent = "Packaging ZIP...";

      try {
        const zip = new JSZip();
        zipQueue.forEach(item => {
          zip.file(item.name, item.blob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "compressed-images.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (window.showToast) window.showToast("ZIP downloaded successfully!", "success");
      } catch (err) {
        if (window.showToast) window.showToast("ZIP creation failed", "error");
      } finally {
        zipBtn.disabled = false;
        zipBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          Download All as ZIP
        `;
      }
    });

    output.prepend(zipBtn);
  }
})();
