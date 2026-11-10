/**
 * ImageCompressor - PDF Splitter Engine
 * Extracts individual pages from PDF documents and exports them as a ZIP archive.
 */

(function () {
  "use strict";

  const pdfInput = document.getElementById("pdfInput");
  const output = document.getElementById("output");
  const splitBtn = document.getElementById("splitBtn");

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

  if (splitBtn) {
    splitBtn.addEventListener("click", async () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please select a PDF first", "error");
        else alert("Please select a PDF first");
        return;
      }

      if (!window.PDFLib || !window.JSZip) {
        if (window.showToast) window.showToast("Required libraries failed to load. Please refresh.", "error");
        return;
      }

      splitBtn.disabled = true;
      splitBtn.textContent = "Splitting Pages...";

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Extracting Pages...</h3>
          </div>
          <div class="result-body">
            <p class="text-muted">Splitting "${file.name}" into individual page documents...</p>
          </div>
        </div>
      `;

      try {
        const bytes = await file.arrayBuffer();
        const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        const totalPages = doc.getPageCount();
        const zip = new JSZip();
        const baseName = file.name.replace(/\.pdf$/i, "");

        for (let i = 0; i < totalPages; i++) {
          const newDoc = await PDFLib.PDFDocument.create();
          const [page] = await newDoc.copyPages(doc, [i]);
          newDoc.addPage(page);
          const pageBytes = await newDoc.save();
          zip.file(`${baseName}-page-${i + 1}.pdf`, pageBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const sizeKB = (zipBlob.size / 1024).toFixed(1);

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>PDF Split Complete</h3>
              <span class="badge">${totalPages} Separate Pages</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Source PDF</p><strong>${file.name}</strong></div>
                <div><p>Extracted Pages</p><strong>${totalPages} Pages</strong></div>
                <div><p>ZIP Archive Size</p><strong>${sizeKB} KB</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="${baseName}-split-pages.zip" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  Download All Pages (.ZIP)
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`Extracted ${totalPages} pages into ZIP!`, "success");
        }
      } catch (err) {
        console.error("PDF split failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Split Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not split this PDF. The document may be corrupted or protected.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to split PDF", "error");
      } finally {
        splitBtn.disabled = false;
        splitBtn.textContent = "Split PDF";
      }
    });
  }
})();
