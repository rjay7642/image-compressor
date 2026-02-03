const imageInput = document.getElementById("imageInput");
const compressBtn = document.getElementById("compressBtn");
const output = document.getElementById("output");
const targetSizeSelect = document.getElementById("targetSize");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");

compressBtn.addEventListener("click", () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please select an image first");
    return;
  }

  const targetKB = parseInt(targetSizeSelect.value);
  progressBox.style.display = "block";
  progressBar.style.width = "0%";
  let fakeProgress = 0;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const width = img.width;
      const height = img.height;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;

      function compressLoop() {
        fakeProgress += 12;
        if (fakeProgress > 95) fakeProgress = 95;
        progressBar.style.width = `${fakeProgress}%`;

        canvas.toBlob(blob => {
          const sizeKB = blob.size / 1024;

          if (sizeKB <= targetKB || quality <= 0.1) {
            const url = URL.createObjectURL(blob);
            progressBar.style.width = "100%";
            setTimeout(() => {
              progressBox.style.display = "none";
            }, 500);

            output.innerHTML = `
<div class="result-card">
  <div class="result-header">
    <h3>Compression Complete</h3>
    <span class="badge">High Quality</span>
  </div>

  <div class="result-body">
    <div class="image-preview">
      <img src="${url}" alt="Compressed Image">
    </div>

    <div class="result-info">
      <p>Original Size: <strong>${(file.size / 1024).toFixed(1)} KB</strong></p>
      <p>Compressed Size: <strong>${sizeKB.toFixed(1)} KB</strong></p>
      <p>Saved: <strong>${((file.size / 1024) - sizeKB).toFixed(1)} KB</strong></p>
    </div>

    <a href="${url}" download="compressed.jpg" class="btn-premium">
      Download Compressed Image
    </a>
  </div>
</div>
`;
          } else {
            quality -= 0.05;
            compressLoop();
          }
        }, "image/jpeg", quality);
      }

      compressLoop();
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
});

const fileLabel = document.getElementById("fileLabel");
const imageInput2 = document.getElementById("imageInput");

imageInput2.addEventListener("change", () => {
  if (imageInput2.files.length > 0) {
    fileLabel.innerHTML = `Selected: <strong>${imageInput2.files[0].name}</strong>`;
  }
});

const dropZone = document.getElementById("dropZone");

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
    updateFileLabel();
  }
});

function updateFileLabel() {
  if (imageInput.files.length > 0) {
    fileLabel.innerHTML = `Selected: <strong>${imageInput.files[0].name}</strong>`;
    dropZone.classList.add("selected");
  }
}

imageInput.addEventListener("change", updateFileLabel);
