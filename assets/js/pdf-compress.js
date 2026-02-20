const pdfInput = document.getElementById("pdfInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const compressBtn = document.getElementById("compressBtn");
const qualitySelect = document.getElementById("quality");

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

let currentFile = null;

const presets = {
  screen: { scale: 1.0, jpegQuality: 0.45, label: "Screen (smallest)" },
  ebook: { scale: 1.25, jpegQuality: 0.6, label: "Ebook (balanced)" },
  printer: { scale: 1.6, jpegQuality: 0.75, label: "Printer (better quality)" },
  prepress: { scale: 2.0, jpegQuality: 0.88, label: "Prepress (high quality)" }
};

pdfInput.addEventListener("change", () => handleFile(pdfInput.files[0]));

dropZone.addEventListener("click", () => pdfInput.click());

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    pdfInput.files = e.dataTransfer.files;
    handleFile(pdfInput.files[0]);
  }
});

function handleFile(file) {
  if (!file) return;
  currentFile = file;
  fileLabel.innerHTML = `Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function dataUrlFromCanvas(canvas, quality) {
  return canvas.toDataURL("image/jpeg", quality);
}

compressBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Please select a PDF first");
    return;
  }

  if (!window.pdfjsLib || !window.jspdf || !window.jspdf.jsPDF) {
    alert("Required PDF libraries failed to load. Please refresh the page.");
    return;
  }

  const preset = presets[qualitySelect.value] || presets.ebook;

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Compressing...</h3></div>
      <div class="result-body"><p class="result-info">Processing pages in your browser.</p></div>
    </div>
  `;

  try {
    const arrayBuffer = await currentFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const { jsPDF } = window.jspdf;

    let outPdf = null;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const layoutViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale: preset.scale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;

      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
      const imageData = dataUrlFromCanvas(canvas, preset.jpegQuality);

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

      output.innerHTML = `
        <div class="result-card">
          <div class="result-header"><h3>Compressing...</h3></div>
          <div class="result-body">
            <p class="result-info">Processed page ${pageNum} of ${totalPages} (${preset.label}).</p>
          </div>
        </div>
      `;
    }

    const blob = outPdf.output("blob");
    const url = URL.createObjectURL(blob);
    const saved = Math.max(0, currentFile.size - blob.size);

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Compression Complete</h3></div>
        <div class="result-body">
          <p class="result-info">Original: <strong>${formatKB(currentFile.size)}</strong></p>
          <p class="result-info">Compressed: <strong>${formatKB(blob.size)}</strong></p>
          <p class="result-info">Saved: <strong>${formatKB(saved)}</strong></p>
          <a href="${url}" download="${currentFile.name.replace(/\.pdf$/i, "")}-compressed.pdf" class="btn-premium">Download PDF</a>
        </div>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Compression Failed</h3></div>
        <div class="result-body">
          <p class="result-info">Could not process this PDF. Try another file.</p>
        </div>
      </div>
    `;
  }
});
