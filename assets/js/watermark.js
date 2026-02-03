const imageInput = document.getElementById("imageInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const applyBtn = document.getElementById("applyBtn");
const watermarkText = document.getElementById("watermarkText");
const opacity = document.getElementById("opacity");
const fontSize = document.getElementById("fontSize");
const position = document.getElementById("position");

let currentImage = null;

imageInput.addEventListener("change", () => handleFile(imageInput.files[0]));

dropZone.addEventListener("click", () => imageInput.click());

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

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
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drawWatermark() {
  if (!currentImage) return;
  const text = watermarkText.value.trim() || "Watermark";
  const size = parseInt(fontSize.value) || 32;
  const alpha = (parseInt(opacity.value) || 40) / 100;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;

  ctx.drawImage(currentImage, 0, 0);
  ctx.font = `bold ${size}px Space Grotesk, Arial`;
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;

  const padding = 20;
  const metrics = ctx.measureText(text);
  let x = padding;
  let y = size + padding;

  switch (position.value) {
    case "top-right":
      x = canvas.width - metrics.width - padding;
      y = size + padding;
      break;
    case "bottom-left":
      x = padding;
      y = canvas.height - padding;
      break;
    case "bottom-right":
      x = canvas.width - metrics.width - padding;
      y = canvas.height - padding;
      break;
    case "center":
      x = (canvas.width - metrics.width) / 2;
      y = canvas.height / 2;
      break;
    default:
      x = padding;
      y = size + padding;
  }

  ctx.fillText(text, x, y);

  const url = canvas.toDataURL("image/png");
  output.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <h3>Watermark Applied</h3>
      </div>
      <div class="result-body">
        <div class="image-preview">
          <img src="${url}" alt="Watermarked image preview">
        </div>
        <a href="${url}" download="watermarked-image.png" class="btn-premium">Download Watermarked Image</a>
      </div>
    </div>
  `;
}

applyBtn.addEventListener("click", () => {
  if (!currentImage) {
    alert("Please select an image first");
    return;
  }
  drawWatermark();
});
