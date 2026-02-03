const imageInput = document.getElementById("imageInput");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const output = document.getElementById("output");
const readBtn = document.getElementById("readBtn");

let currentFile = null;

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
  currentFile = file;
  fileLabel.innerHTML = `Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");
}

readBtn.addEventListener("click", () => {
  if (!currentFile) {
    alert("Please select an image first");
    return;
  }

  if (!window.EXIF) {
    alert("EXIF reader failed to load. Please refresh the page.");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      EXIF.getData(img, function () {
        const allData = EXIF.getAllTags(this) || {};
        const entries = Object.keys(allData);

        if (!entries.length) {
          output.innerHTML = `
            <div class="result-card">
              <div class="result-header"><h3>No Metadata Found</h3></div>
              <div class="result-body"><p class="result-info">This image does not contain EXIF metadata.</p></div>
            </div>
          `;
          return;
        }

        const listItems = entries
          .sort()
          .map(key => `<li><strong>${key}</strong>: ${allData[key]}</li>`)
          .join("");

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header"><h3>Metadata</h3></div>
            <div class="result-body">
              <ul class="meta-list">${listItems}</ul>
            </div>
          </div>
        `;
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(currentFile);
});
