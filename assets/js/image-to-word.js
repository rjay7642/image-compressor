/**
 * ImageCompressor - Image to Word (OCR) Engine
 * Extracts text from photos, scans, and documents using client-side Tesseract.js.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const convertBtn = document.getElementById("convertBtn");
  const output = document.getElementById("output");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");
  const ocrLang = document.getElementById("ocrLang");
  const includeImage = document.getElementById("includeImage");

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

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", async () => {
      const files = getSelectedFiles();
      if (!files.length) {
        if (window.showToast) window.showToast("Please select images first", "error");
        else alert("Please select image files first");
        return;
      }

      if (!window.Tesseract) {
        if (window.showToast) window.showToast("OCR engine failed to load. Please refresh.", "error");
        return;
      }

      convertBtn.disabled = true;
      convertBtn.textContent = "Running OCR...";
      output.innerHTML = "";

      if (progressBox) progressBox.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";

      try {
        const lang = ocrLang ? ocrLang.value : "eng";
        const sections = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await Tesseract.recognize(file, lang);
          const text = (result && result.data && result.data.text) ? result.data.text.trim() : "";

          let imgTag = "";
          if (includeImage && includeImage.checked) {
            const dataUrl = await fileToDataURL(file);
            imgTag = `<p><img src="${dataUrl}" style="max-width:500px; height:auto; border:1px solid #e2e8f0; border-radius:8px;"></p>`;
          }

          sections.push(`
            <h2 style="color:#0284c7; font-family:sans-serif;">${escapeHtml(file.name)}</h2>
            ${imgTag}
            <div style="font-family:Calibri,Arial,sans-serif; font-size:11pt; line-height:1.6; margin-bottom:24px;">
              ${text ? escapeHtml(text).replace(/\n/g, "<br>") : "<em>No recognizable text found in this image.</em>"}
            </div>
            <div style="page-break-after: always;"></div>
          `);

          const pct = Math.round(((i + 1) / files.length) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
        }

        const docHtml = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>Extracted Text Document</title>
          </head>
          <body style="font-family: Calibri, Arial, sans-serif; padding: 24px;">
            ${sections.join("\n")}
          </body>
          </html>
        `;

        const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const sizeKB = (blob.size / 1024).toFixed(1);

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>OCR Extraction Complete</h3>
              <span class="badge">${files.length} Image(s)</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Processed Images</p><strong>${files.length} Files</strong></div>
                <div><p>Language</p><strong>${lang.toUpperCase()}</strong></div>
                <div><p>Document Size</p><strong>${sizeKB} KB</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="ocr-extracted-text.doc" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Extracted Word Doc
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`OCR complete for ${files.length} images!`, "success");
        }
      } catch (err) {
        console.error("OCR extraction failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">OCR Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not extract text. Please ensure images contain clear, legible typography.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("OCR processing failed", "error");
      } finally {
        if (progressBox) progressBox.style.display = "none";
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert to Word";
      }
    });
  }
})();
