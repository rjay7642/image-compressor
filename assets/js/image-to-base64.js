const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");

let currentFile = null;

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
  currentFile = file;
  fileLabel.innerHTML = `Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");
}

convertBtn.addEventListener("click", () => {
  if (!currentFile) {
    alert("Please select an image first");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>Base64 Generated</h3>
        </div>
        <div class="result-body">
          <textarea class="base64-area" readonly>${dataUrl}</textarea>
          <button class="btn-premium copy-btn" type="button">Copy Base64</button>
        </div>
      </div>
    `;

    const copyBtn = output.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(dataUrl).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy Base64";
        }, 1500);
      });
    });
  };
  reader.readAsDataURL(currentFile);
});
