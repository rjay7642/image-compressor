// Image Resizer Logic – ImageCompressor (SEO safe, client-side only)

const imageInput = document.getElementById("imageInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const lockRatio = document.getElementById("lockRatio");
const resizeBtn = document.getElementById("resizeBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");

let originalWidth = 0;
let originalHeight = 0;
let aspectRatio = 1;
let currentImage = null;

// ---------- File Select ----------
imageInput.addEventListener("change", handleFileSelect);

function handleFileSelect() {
  if (!imageInput.files.length) return;

  const file = imageInput.files[0];
  fileLabel.innerHTML = `✅ Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      originalWidth = img.width;
      originalHeight = img.height;
      aspectRatio = originalWidth / originalHeight;

      widthInput.value = originalWidth;
      heightInput.value = originalHeight;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------- Aspect Ratio Logic ----------
widthInput.addEventListener("input", () => {
  if (lockRatio.checked && originalWidth) {
    heightInput.value = Math.round(widthInput.value / aspectRatio);
  }
});

heightInput.addEventListener("input", () => {
  if (lockRatio.checked && originalHeight) {
    widthInput.value = Math.round(heightInput.value * aspectRatio);
  }
});

// ---------- Resize Button ----------
resizeBtn.addEventListener("click", () => {
  if (!currentImage) {
    alert("Please select an image first");
    return;
  }

  const newWidth = parseInt(widthInput.value);
  const newHeight = parseInt(heightInput.value);

  if (!newWidth || !newHeight) {
    alert("Please enter valid width and height");
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = newWidth;
  canvas.height = newHeight;

  ctx.drawImage(currentImage, 0, 0, newWidth, newHeight);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>✅ Resize Complete</h3>
        </div>

        <div class="result-body">
          <div class="image-preview">
            <img src="${url}" alt="Resized Image Preview">
          </div>

          <div class="result-info">
            <p>📐 Original: <strong>${originalWidth} × ${originalHeight}px</strong></p>
            <p>📏 New: <strong>${newWidth} × ${newHeight}px</strong></p>
          </div>

          <a href="${url}" download="resized-image.png" class="btn-premium">
            ⬇ Download Resized Image
          </a>
        </div>
      </div>
    `;

  }, "image/png", 0.95);
});

// ---------- Drag & Drop ----------
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