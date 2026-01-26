// Image Converter Logic – ImageCompressor (client-side only, SEO & privacy safe)

const imageInput = document.getElementById("imageInput");
const formatSelect = document.getElementById("formatSelect");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");

let currentImage = null;
let originalName = "image";

// -------- File Select --------
imageInput.addEventListener("change", handleFileSelect);

function handleFileSelect() {
  if (!imageInput.files.length) return;

  const file = imageInput.files[0];
  originalName = file.name.replace(/\.[^/.]+$/, "");

  fileLabel.innerHTML = `✅ Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// -------- Convert Button --------
convertBtn.addEventListener("click", () => {
  if (!currentImage) {
    alert("Please select an image first");
    return;
  }

  const format = formatSelect.value; // image/jpeg | image/png | image/webp

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = currentImage.width;
  canvas.height = currentImage.height;

  ctx.drawImage(currentImage, 0, 0);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);

    const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>✅ Conversion Complete</h3>
        </div>

        <div class="result-body">
          <div class="image-preview">
            <img src="${url}" alt="Converted Image Preview">
          </div>

          <div class="result-info">
            <p>🖼 Format: <strong>${ext.toUpperCase()}</strong></p>
            <p>📐 Size: <strong>${currentImage.width} × ${currentImage.height}px</strong></p>
          </div>

          <a href="${url}" download="${originalName}.${ext}" class="btn-premium">
            ⬇ Download Converted Image
          </a>
        </div>
      </div>
    `;

  }, format, 0.95);
});

// -------- Drag & Drop --------
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
    handleFileSelect();
  }
});