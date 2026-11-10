/**
 * ImageCompressor - PDF Merge Engine
 * Combines multiple PDF files strictly adhering to the user's arranged sequence.
 */

(function () {
  "use strict";

  const pdfInput = document.getElementById("pdfInput");
  const output = document.getElementById("output");
  const mergeBtn = document.getElementById("mergeBtn");

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

  if (mergeBtn) {
    mergeBtn.addEventListener("click", async () => {
      const files = getSelectedFiles();
      if (!files.length) {
        if (window.showToast) window.showToast("Please choose PDF files first", "error");
        else alert("Please select PDFs first");
        return;
      }

      if (files.length < 2) {
        if (window.showToast) window.showToast("Please select at least 2 PDFs to merge", "info");
      }

      if (!window.PDFLib) {
        if (window.showToast) window.showToast("PDF engine failed to load. Please refresh.", "error");
        return;
      }

      mergeBtn.disabled = true;
      mergeBtn.textContent = "Merging PDFs...";

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Merging Documents...</h3>
          </div>
          <div class="result-body">
            <p class="text-muted">Combining ${files.length} PDFs in the selected order...</p>
          </div>
        </div>
      `;

      try {
        const merged = await PDFLib.PDFDocument.create();
        let totalPages = 0;

        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach(page => merged.addPage(page));
          totalPages += pages.length;
        }

        const mergedBytes = await merged.save();
        const blob = new Blob([mergedBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const sizeKB = (blob.size / 1024).toFixed(1);

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>PDF Merge Complete</h3>
              <span class="badge">${files.length} Files • ${totalPages} Pages</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Input PDFs</p><strong>${files.length} Documents</strong></div>
                <div><p>Total Pages</p><strong>${totalPages} Pages</strong></div>
                <div><p>Merged Size</p><strong>${sizeKB} KB</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="merged-document.pdf" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Merged PDF
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`Merged ${files.length} PDFs (${totalPages} pages total)!`, "success");
        }
      } catch (err) {
        console.error("PDF merge failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Merge Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not merge these PDFs. One or more files may be corrupted or password-protected.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to merge PDFs", "error");
      } finally {
        mergeBtn.disabled = false;
        mergeBtn.textContent = "Merge PDFs";
      }
    });
  }
})();
