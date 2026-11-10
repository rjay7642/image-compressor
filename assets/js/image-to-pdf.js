/**
 * ImageCompressor - Image to PDF Converter Engine
 * Converts single or multiple images into a combined PDF document in user-specified order.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const convertBtn = document.getElementById("convertBtn");
  const output = document.getElementById("output");
  const pageSizeSelect = document.getElementById("pageSize");

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

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function imageToJpeg(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", async () => {
      const files = getSelectedFiles();
      if (!files.length) {
        if (window.showToast) window.showToast("Please select images first", "error");
        else alert("Please select images first");
        return;
      }

      if (!window.jspdf || !window.jspdf.jsPDF) {
        if (window.showToast) window.showToast("PDF engine failed to load. Please refresh the page.", "error");
        return;
      }

      convertBtn.disabled = true;
      convertBtn.textContent = "Creating PDF...";

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h3>Generating PDF...</h3>
          </div>
          <div class="result-body">
            <p class="text-muted">Combining ${files.length} image(s) into your PDF document...</p>
          </div>
        </div>
      `;

      const { jsPDF } = window.jspdf;
      const pageSize = pageSizeSelect ? pageSizeSelect.value : "a4";

      try {
        let pdf = null;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await fileToDataURL(file);
          const img = await loadImage(dataUrl);
          const jpegDataUrl = imageToJpeg(img);

          let pageWidth = img.width;
          let pageHeight = img.height;

          if (pageSize === "a4") {
            pageWidth = 595.28;
            pageHeight = 841.89;
          } else if (pageSize === "letter") {
            pageWidth = 612;
            pageHeight = 792;
          }

          if (!pdf) {
            pdf = new jsPDF({ unit: "pt", format: [pageWidth, pageHeight] });
          } else {
            pdf.addPage([pageWidth, pageHeight]);
          }

          const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          const x = (pageWidth - newWidth) / 2;
          const y = (pageHeight - newHeight) / 2;

          pdf.addImage(jpegDataUrl, "JPEG", x, y, newWidth, newHeight);
        }

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const sizeKB = (blob.size / 1024).toFixed(1);

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>PDF Generated Successfully</h3>
              <span class="badge">${files.length} Pages</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Page Count</p><strong>${files.length} Pages</strong></div>
                <div><p>Page Format</p><strong>${pageSize.toUpperCase()}</strong></div>
                <div><p>File Size</p><strong>${sizeKB} KB</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="images-combined.pdf" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Combined PDF
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`PDF created with ${files.length} pages!`, "success");
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Generation Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not compile images into PDF. Please try again with valid image files.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to compile PDF", "error");
      } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert to PDF";
      }
    });
  }
})();
