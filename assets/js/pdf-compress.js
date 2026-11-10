/**
 * ImageCompressor - PDF Compressor Engine
 * Compresses PDF documents in-browser via canvas rendering and multi-page stream re-encoding.
 */

(function () {
  "use strict";

  const pdfInput = document.getElementById("pdfInput");
  const output = document.getElementById("output");
  const compressBtn = document.getElementById("compressBtn");
  const qualitySelect = document.getElementById("quality");

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const presets = {
    screen: { scale: 1.0, jpegQuality: 0.45, label: "Screen (Smallest Size)" },
    ebook: { scale: 1.25, jpegQuality: 0.65, label: "Ebook (Balanced Quality)" },
    printer: { scale: 1.6, jpegQuality: 0.80, label: "Print (High Detail)" },
    prepress: { scale: 2.0, jpegQuality: 0.90, label: "Prepress (Max Clarity)" }
  };

  function getSelectedFile() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(pdfInput);
      if (list && list.length > 0) return list[0];
    }
    if (pdfInput && pdfInput.files && pdfInput.files.length > 0) {
      return pdfInput.files[0];
    }
    return null;
  }

  if (pdfInput) {
    pdfInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  function formatKB(bytes) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (compressBtn) {
    compressBtn.addEventListener("click", async () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose a PDF first", "error");
        else alert("Please select a PDF first");
        return;
      }

      if (!window.pdfjsLib || !window.jspdf || !window.jspdf.jsPDF) {
        if (window.showToast) window.showToast("PDF engine failed to load. Please refresh the page.", "error");
        return;
      }

      const presetKey = qualitySelect ? qualitySelect.value : "ebook";
      const preset = presets[presetKey] || presets.ebook;

      compressBtn.disabled = true;
      compressBtn.textContent = "Compressing PDF...";

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Compressing Document...</h3>
          </div>
          <div class="result-body">
            <p id="compressStatus" class="text-muted">Initializing document pages...</p>
          </div>
        </div>
      `;

      const statusEl = document.getElementById("compressStatus");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const { jsPDF } = window.jspdf;

        let outPdf = null;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          if (statusEl) {
            statusEl.textContent = `Optimizing page ${pageNum} of ${totalPages} (${preset.label})...`;
          }

          const page = await pdf.getPage(pageNum);
          const layoutViewport = page.getViewport({ scale: 1 });
          const renderViewport = page.getViewport({ scale: preset.scale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = renderViewport.width;
          canvas.height = renderViewport.height;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
          const imageData = canvas.toDataURL("image/jpeg", preset.jpegQuality);

          const pageWidth = layoutViewport.width;
          const pageHeight = layoutViewport.height;
          const orientation = pageWidth > pageHeight ? "landscape" : "portrait";

          if (!outPdf) {
            outPdf = new jsPDF({
              orientation,
              unit: "pt",
              format: [pageWidth, pageHeight],
              compress: true
            });
          } else {
            outPdf.addPage([pageWidth, pageHeight], orientation);
          }

          outPdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
        }

        const blob = outPdf.output("blob");
        const url = URL.createObjectURL(blob);
        const saved = Math.max(0, file.size - blob.size);
        const percent = file.size > 0 ? Math.round((saved / file.size) * 100) : 0;
        const baseName = file.name.replace(/\.pdf$/i, "");

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>PDF Compression Complete</h3>
              <span class="badge">-${percent}% Size</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Original Size</p><strong>${formatKB(file.size)}</strong></div>
                <div><p>Compressed Size</p><strong>${formatKB(blob.size)}</strong></div>
                <div><p>Saved Space</p><strong style="color:#10b981;">-${percent}% (${formatKB(saved)})</strong></div>
                <div><p>Total Pages</p><strong>${totalPages} Pages</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="${baseName}-compressed.pdf" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Compressed PDF
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`PDF compressed to ${formatKB(blob.size)}!`, "success");
        }
      } catch (err) {
        console.error("PDF compression failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Compression Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not compress this PDF. The document may be damaged or password-protected.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to compress PDF", "error");
      } finally {
        compressBtn.disabled = false;
        compressBtn.textContent = "Compress PDF";
      }
    });
  }
})();
