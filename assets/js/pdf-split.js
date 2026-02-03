const pdfInput = document.getElementById("pdfInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const splitBtn = document.getElementById("splitBtn");

let currentFile = null;

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

splitBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Please select a PDF first");
    return;
  }

  if (!window.PDFLib || !window.JSZip) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Splitting...</h3></div>
      <div class="result-body"><p class="result-info">Preparing individual pages.</p></div>
    </div>
  `;

  const bytes = await currentFile.arrayBuffer();
  const doc = await PDFLib.PDFDocument.load(bytes);
  const totalPages = doc.getPageCount();
  const zip = new JSZip();

  for (let i = 0; i < totalPages; i++) {
    const newDoc = await PDFLib.PDFDocument.create();
    const [page] = await newDoc.copyPages(doc, [i]);
    newDoc.addPage(page);
    const pageBytes = await newDoc.save();
    zip.file(`page-${i + 1}.pdf`, pageBytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Split Complete</h3></div>
      <div class="result-body">
        <p class="result-info">All pages are ready in a ZIP file.</p>
        <a href="${url}" download="pages.zip" class="btn-premium">Download ZIP</a>
      </div>
    </div>
  `;
});
