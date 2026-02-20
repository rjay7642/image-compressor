const imageInput = document.getElementById("imageInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const rotateBtn = document.getElementById("rotateBtn");
const angleSelect = document.getElementById("angleSelect");
const flipH = document.getElementById("flipH");
const flipV = document.getElementById("flipV");

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
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

rotateBtn.addEventListener("click", () => {
  if (!currentImage) {
    alert("Please select an image first");
    return;
  }

  const angle = parseInt(angleSelect.value, 10) || 0;
  const radians = (angle * Math.PI) / 180;
  const quarterTurn = Math.abs(angle % 180) === 90;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = quarterTurn ? currentImage.height : currentImage.width;
  canvas.height = quarterTurn ? currentImage.width : currentImage.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.scale(flipH.checked ? -1 : 1, flipV.checked ? -1 : 1);
  ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>Rotation Complete</h3>
        </div>
        <div class="result-body">
          <div class="image-preview">
            <img src="${url}" alt="Rotated Image Preview">
          </div>
          <a href="${url}" download="rotated-image.png" class="btn-premium">
            Download Rotated Image
          </a>
        </div>
      </div>
    `;
  }, "image/png", 0.95);
});
