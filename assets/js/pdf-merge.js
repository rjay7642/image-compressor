const pdfInput = document.getElementById("pdfInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const mergeBtn = document.getElementById("mergeBtn");

let files = [];

pdfInput.addEventListener("change", () => handleFiles(pdfInput.files));

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
    handleFiles(pdfInput.files);
  }
});

function handleFiles(fileList) {
  files = Array.from(fileList || []);
  if (!files.length) return;
  fileLabel.innerHTML = `Selected: <strong>${files.length}</strong> PDFs`;
  dropZone.classList.add("selected");
}

mergeBtn.addEventListener("click", async () => {
  if (!files.length) {
    alert("Please select PDFs first");
    return;
  }

  if (!window.PDFLib) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Merging...</h3></div>
      <div class="result-body"><p class="result-info">Combining your PDFs.</p></div>
    </div>
  `;

  const merged = await PDFLib.PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Merge Complete</h3></div>
      <div class="result-body">
        <p class="result-info">Your merged PDF is ready.</p>
        <a href="${url}" download="merged.pdf" class="btn-premium">Download PDF</a>
      </div>
    </div>
  `;
});
