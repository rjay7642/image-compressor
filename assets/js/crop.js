const imageInput = document.getElementById("imageInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const cropBtn = document.getElementById("cropBtn");
const xInput = document.getElementById("cropX");
const yInput = document.getElementById("cropY");
const widthInput = document.getElementById("cropWidth");
const heightInput = document.getElementById("cropHeight");

let currentImage = null;

imageInput.addEventListener("change", () => handleFile(imageInput.files[0]));

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
    handleFile(imageInput.files[0]);
  }
});

function handleFile(file) {
  if (!file) return;
  fileLabel.innerHTML = `Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      xInput.value = 0;
      yInput.value = 0;
      widthInput.value = img.width;
      heightInput.value = img.height;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

cropBtn.addEventListener("click", () => {
  if (!currentImage) {
    alert("Please select an image first");
    return;
  }

  const x = Math.max(0, parseInt(xInput.value, 10) || 0);
  const y = Math.max(0, parseInt(yInput.value, 10) || 0);
  const maxWidth = currentImage.width - x;
  const maxHeight = currentImage.height - y;
  const width = Math.min(maxWidth, Math.max(1, parseInt(widthInput.value, 10) || maxWidth));
  const height = Math.min(maxHeight, Math.max(1, parseInt(heightInput.value, 10) || maxHeight));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(currentImage, x, y, width, height, 0, 0, width, height);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>Crop Complete</h3>
        </div>
        <div class="result-body">
          <div class="image-preview">
            <img src="${url}" alt="Cropped Image Preview">
          </div>
          <div class="result-info">
            <p>Crop Area: <strong>${x}, ${y}, ${width} x ${height}</strong></p>
          </div>
          <a href="${url}" download="cropped-image.png" class="btn-premium">
            Download Cropped Image
          </a>
        </div>
      </div>
    `;
  }, "image/png", 0.95);
});
