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

let files = [];

pdfInput.addEventListener("change", () => handleFiles(pdfInput.files));

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
    handleFiles(pdfInput.files);
  }
});

function handleFiles(fileList) {
  files = window.getToolFiles ? window.getToolFiles(pdfInput) : Array.from(fileList || []);
  if (!files.length) return;
  fileLabel.innerHTML = `Selected: <strong>${files.length}</strong> PDF(s)`;
  dropZone.classList.add("selected");
}

function sanitizeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/png");
  });
}

function updateProgress(done, total) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = `${percent}%`;
}

function showZipButton(zipQueue) {
  if (!zipQueue.length || !window.JSZip) return;

  const btn = document.createElement("button");
  btn.className = "btn-premium";
  btn.style.marginBottom = "12px";
  btn.textContent = "Download All as ZIP";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Preparing ZIP...";

    try {
      const zip = new JSZip();
      zipQueue.forEach(item => zip.file(item.name, item.blob));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf-pages-images.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      btn.disabled = false;
      btn.textContent = "Download All as ZIP";
    }
  });

  output.prepend(btn);
}

extractBtn.addEventListener("click", async () => {
  files = window.getToolFiles ? window.getToolFiles(pdfInput) : files;

  if (!files.length) {
    alert("Please select at least one PDF file first");
    return;
  }

  if (!window.pdfjsLib) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = "";
  progressBox.style.display = "block";
  progressBar.style.width = "0%";

  try {
    const scale = parseFloat(scaleSelect.value);
    const jobs = [];
    let totalPages = 0;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      jobs.push({ file, pdf });
      totalPages += pdf.numPages;
    }

    const zipQueue = [];
    let processedPages = 0;

    for (const job of jobs) {
      const baseName = job.file.name.replace(/\.pdf$/i, "");

      for (let pageNum = 1; pageNum <= job.pdf.numPages; pageNum++) {
        const page = await job.pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);
        const imageName = `${baseName}-page-${pageNum}.png`;

        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `
          <div class="result-header">
            <h3>${job.file.name} - Page ${pageNum}</h3>
          </div>
          <div class="result-body">
            <div class="image-preview">
              <img src="${url}" alt="${job.file.name} page ${pageNum}">
            </div>
            <a href="${url}" download="${imageName}" class="btn-premium">
              Download Page ${pageNum}
            </a>
          </div>
        `;
        output.appendChild(card);

        zipQueue.push({
          name: `${sanitizeName(baseName)}/page-${pageNum}.png`,
          blob
        });

        processedPages++;
        updateProgress(processedPages, totalPages);
      }
    }

    showZipButton(zipQueue);
  } catch (error) {
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Extraction Failed</h3></div>
        <div class="result-body">
          <p class="result-info">Could not process one or more PDFs.</p>
        </div>
      </div>
    `;
  } finally {
    setTimeout(() => {
      progressBox.style.display = "none";
    }, 400);
  }
});
