const pdfInput = document.getElementById("pdfInput");
const extractBtn = document.getElementById("extractBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const scaleSelect = document.getElementById("scaleSelect");

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

let currentFile = null;

pdfInput.addEventListener("change", () => handleFile(pdfInput.files[0]));

dropZone.addEventListener("click", () => pdfInput.click());

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

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

extractBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Please select a PDF file first");
    return;
  }

  if (!window.pdfjsLib) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = "";
  progressBox.style.display = "block";
  progressBar.style.width = "0%";

  const arrayBuffer = await currentFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = pdf.numPages;
  const scale = parseFloat(scaleSelect.value);

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-header">
        <h3>Page ${pageNum}</h3>
      </div>
      <div class="result-body">
        <div class="image-preview">
          <img src="${dataUrl}" alt="Page ${pageNum}">
        </div>
        <a href="${dataUrl}" download="${currentFile.name.replace(/\.pdf$/i, "")}-page-${pageNum}.png" class="btn-premium">
          Download Page ${pageNum}
        </a>
      </div>
    `;
    output.appendChild(card);

    const percent = Math.round((pageNum / total) * 100);
    progressBar.style.width = `${percent}%`;
  }

  setTimeout(() => {
    progressBox.style.display = "none";
  }, 400);
});
