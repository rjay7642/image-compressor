const pdfInput = document.getElementById("pdfInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const compressBtn = document.getElementById("compressBtn");
const qualitySelect = document.getElementById("quality");

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

compressBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Please select a PDF first");
    return;
  }

  const formData = new FormData();
  formData.append("file", currentFile);
  formData.append("quality", qualitySelect.value);

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header"><h3>Compressing...</h3></div>
      <div class="result-body"><p class="result-info">Sending file to server.</p></div>
    </div>
  `;

  try {
    const response = await fetch("/api/convert/pdf-compress", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Compression failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Compression Complete</h3></div>
        <div class="result-body">
          <p class="result-info">Your compressed PDF is ready.</p>
          <a href="${url}" download="compressed.pdf" class="btn-premium">Download PDF</a>
        </div>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Compression Failed</h3></div>
        <div class="result-body">
          <p class="result-info">Server not configured. Ensure Ghostscript is installed and API is running.</p>
        </div>
      </div>
    `;
  }
});
