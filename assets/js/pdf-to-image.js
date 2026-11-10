/**
 * ImageCompressor - PDF to Image Converter Engine
 * Renders PDF pages into crisp, high-resolution PNG images with individual & ZIP downloads.
 */

(function () {
  "use strict";

  const pdfInput = document.getElementById("pdfInput");
  const extractBtn = document.getElementById("extractBtn");
  const output = document.getElementById("output");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");
  const scaleSelect = document.getElementById("scaleSelect");

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function getSelectedFiles() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(pdfInput);
      if (list && list.length > 0) return list;
    }
    if (pdfInput && pdfInput.files && pdfInput.files.length > 0) {
      return Array.from(pdfInput.files);
    }
    return [];
  }

  if (pdfInput) {
    pdfInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  function sanitizeName(name) {
    return name.replace(/[\\/:*?"<>|]/g, "_");
  }

  function canvasToBlob(canvas) {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), "image/png");
    });
  }

  if (extractBtn) {
    extractBtn.addEventListener("click", async () => {
      const files = getSelectedFiles();
      if (!files.length) {
        if (window.showToast) window.showToast("Please choose at least one PDF", "error");
        else alert("Please select a PDF first");
        return;
      }

      if (!window.pdfjsLib) {
        if (window.showToast) window.showToast("PDF rendering engine failed to load. Please refresh.", "error");
        return;
      }

      extractBtn.disabled = true;
      extractBtn.textContent = "Extracting Pages...";
      output.innerHTML = "";

      if (progressBox) progressBox.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";

      const scale = parseFloat(scaleSelect ? scaleSelect.value : 1.5) || 1.5;
      const zipQueue = [];

      try {
        let totalPages = 0;
        const pdfDocs = [];

        for (const file of files) {
          const buffer = await file.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
          pdfDocs.push({ file, doc });
          totalPages += doc.numPages;
        }

        let processed = 0;

        for (const { file, doc } of pdfDocs) {
          const baseName = file.name.replace(/\.pdf$/i, "");

          for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;
            const blob = await canvasToBlob(canvas);
            const url = URL.createObjectURL(blob);
            const imageName = `${baseName}-page-${pageNum}.png`;

            zipQueue.push({
              name: `${sanitizeName(baseName)}/page-${pageNum}.png`,
              blob
            });

            const card = document.createElement("div");
            card.className = "result-card";
            card.innerHTML = `
              <div class="result-header">
                <h3>${file.name} — Page ${pageNum}</h3>
                <span class="badge">${Math.round(canvas.width)} × ${Math.round(canvas.height)}px</span>
              </div>
              <div class="result-body">
                <div class="image-preview">
                  <img src="${url}" alt="Page ${pageNum}">
                </div>
                <div class="d-flex justify-content-center mt-2">
                  <a href="${url}" download="${imageName}" class="btn-premium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download Page ${pageNum}
                  </a>
                </div>
              </div>
            `;
            output.appendChild(card);

            processed++;
            const pct = Math.round((processed / totalPages) * 100);
            if (progressBar) progressBar.style.width = `${pct}%`;
          }
        }

        if (zipQueue.length > 1 && window.JSZip) {
          showMasterZipButton(zipQueue);
        }

        if (window.showToast) {
          window.showToast(`Extracted ${processed} page images!`, "success");
        }
      } catch (err) {
        console.error("PDF to image error:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Extraction Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not render pages from the provided PDF file.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to render PDF pages", "error");
      } finally {
        if (progressBox) progressBox.style.display = "none";
        extractBtn.disabled = false;
        extractBtn.textContent = "Convert PDF to Images";
      }
    });
  }

  function showMasterZipButton(zipQueue) {
    const zipBtn = document.createElement("button");
    zipBtn.className = "btn-premium w-100 mb-4";
    zipBtn.style.padding = "16px 24px";
    zipBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
      Download All (${zipQueue.length}) Pages as ZIP
    `;

    zipBtn.addEventListener("click", async () => {
      zipBtn.disabled = true;
      zipBtn.textContent = "Creating ZIP...";

      try {
        const zip = new JSZip();
        zipQueue.forEach(item => zip.file(item.name, item.blob));
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "pdf-pages-png.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (window.showToast) window.showToast("All pages downloaded as ZIP!", "success");
      } catch (err) {
        if (window.showToast) window.showToast("ZIP generation failed", "error");
      } finally {
        zipBtn.disabled = false;
        zipBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          Download All (${zipQueue.length}) Pages as ZIP
        `;
      }
    });

    output.prepend(zipBtn);
  }
})();
