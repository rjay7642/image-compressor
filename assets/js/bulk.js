// Bulk Image Compressor Logic – ImageCompressor (client-side only, SEO & privacy safe)
// ZIP download supported via JSZip

const imageInput = document.getElementById("imageInput");
const targetSizeSelect = document.getElementById("targetSize");
const bulkCompressBtn = document.getElementById("bulkCompressBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");

let files = [];
let zipQueue = []; // { name, blob }

// ---------- File Select ----------
imageInput.addEventListener("change", handleFiles);

function handleFiles() {
  files = Array.from(imageInput.files || []);
  if (!files.length) return;

  fileLabel.innerHTML = `✅ Selected: <strong>${files.length}</strong> images`;
  dropZone.classList.add("selected");
}

// ---------- Drag & Drop ----------
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
    handleFiles();
  }
});

// ---------- Bulk Compress ----------
bulkCompressBtn.addEventListener("click", () => {
  if (!files.length) {
    alert("Please select images first");
    return;
  }

  const targetKB = parseInt(targetSizeSelect.value);
  output.innerHTML = "";
  zipQueue = [];

  progressBox.style.display = "block";
  progressBar.style.width = "0%";

  let completed = 0;

  files.forEach(file => {
    compressSingleImage(file, targetKB, result => {
      completed++;

      const percent = Math.round((completed / files.length) * 100);
      progressBar.style.width = percent + "%";

      appendResultCard(result);
      zipQueue.push({ name: `compressed-${result.name}`, blob: result.blob });

      if (completed === files.length) {
        setTimeout(() => {
          progressBox.style.display = "none";
          showZipButton();
        }, 300);
      }
    });
  });
});

// ---------- Compress One Image ----------
function compressSingleImage(file, targetKB, callback) {
  const reader = new FileReader();

  reader.onload = e => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      let quality = 0.9;

      function loop() {
        canvas.toBlob(blob => {
          const sizeKB = blob.size / 1024;

          if (sizeKB <= targetKB || quality <= 0.1) {
            const url = URL.createObjectURL(blob);

            callback({
              name: file.name,
              originalKB: (file.size / 1024).toFixed(1),
              compressedKB: sizeKB.toFixed(1),
              url,
              blob
            });
          } else {
            quality -= 0.05;
            loop();
          }
        }, "image/jpeg", quality);
      }

      loop();
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

// ---------- UI Result Card ----------
function appendResultCard(data) {
  const div = document.createElement("div");
  div.className = "result-card";

  div.innerHTML = `
    <div class="result-header">
      <h3>✅ ${data.name}</h3>
    </div>

    <div class="result-body">
      <div class="result-info">
        <p>📦 Original: <strong>${data.originalKB} KB</strong></p>
        <p>⚡ Compressed: <strong>${data.compressedKB} KB</strong></p>
      </div>

      <a href="${data.url}" download="compressed-${data.name}" class="btn-premium">
        ⬇ Download
      </a>
    </div>
  `;

  output.appendChild(div);
}

// ---------- ZIP Download ----------
function showZipButton() {
  if (!window.JSZip) {
    console.error("JSZip not loaded – ZIP feature unavailable");
    return;
  }

  const btn = document.createElement("button");
  btn.className = "btn-premium";
  btn.style.marginBottom = "16px";
  btn.textContent = "⬇ Download All as ZIP";

  btn.addEventListener("click", downloadZip);

  output.prepend(btn);
}

async function downloadZip() {
  const zip = new JSZip();

  zipQueue.forEach(file => {
    zip.file(file.name, file.blob);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "compressed-images.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
