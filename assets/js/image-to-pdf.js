const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const pageSizeSelect = document.getElementById("pageSize");

let files = [];

imageInput.addEventListener("change", () => handleFiles(imageInput.files));

dropZone.addEventListener("click", () => imageInput.click());

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
    imageInput.files = e.dataTransfer.files;
    handleFiles(imageInput.files);
  }
});

function handleFiles(fileList) {
  files = window.getToolFiles ? window.getToolFiles(imageInput) : Array.from(fileList || []);
  if (!files.length) return;
  fileLabel.innerHTML = `Selected: <strong>${files.length}</strong> images`;
  dropZone.classList.add("selected");
}

convertBtn.addEventListener("click", async () => {
  files = window.getToolFiles ? window.getToolFiles(imageInput) : files;
  if (!files.length) {
    alert("Please select images first");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pageSize = pageSizeSelect.value;

  let pdf = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    const jpegDataUrl = imageToJpeg(img);

    let pageWidth = img.width;
    let pageHeight = img.height;

    if (pageSize === "a4") {
      pageWidth = 595;
      pageHeight = 842;
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

  output.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <h3>PDF Ready</h3>
      </div>
      <div class="result-body">
        <p class="result-info">Your PDF has been generated successfully.</p>
        <a href="${url}" download="images-to-pdf.pdf" class="btn-premium">Download PDF</a>
      </div>
    </div>
  `;
});

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
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.95);
}
