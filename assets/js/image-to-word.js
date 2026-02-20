const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const ocrLang = document.getElementById("ocrLang");
const includeImage = document.getElementById("includeImage");

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

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function recognizeImage(file, index, total, lang) {
  const base = (index / total) * 100;
  const result = await Tesseract.recognize(file, lang, {
    logger: m => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        const percent = Math.min(100, Math.round(base + (m.progress * (100 / total))));
        progressBar.style.width = `${percent}%`;
      }
    }
  });
  const text = (result && result.data && result.data.text) ? result.data.text.trim() : "";
  return text;
}

convertBtn.addEventListener("click", async () => {
  files = window.getToolFiles ? window.getToolFiles(imageInput) : files;

  if (!files.length) {
    alert("Please select image files first");
    return;
  }

  if (!window.Tesseract) {
    alert("OCR engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = "";
  progressBox.style.display = "block";
  progressBar.style.width = "0%";

  try {
    const lang = ocrLang ? ocrLang.value : "eng";
    const sections = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await recognizeImage(file, i, files.length, lang);
      const imageHtml = includeImage && includeImage.checked
        ? `<img src="${await fileToDataURL(file)}" alt="${escapeHtml(file.name)}" style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:6px;">`
        : "";

      sections.push(`
        <h2>Image ${i + 1}: ${escapeHtml(file.name)}</h2>
        ${imageHtml}
        <p>${text ? escapeHtml(text).replace(/\n/g, "<br>") : "<em>No text detected.</em>"}</p>
        <div style="page-break-after: always;"></div>
      `);
      progressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
    }

    const docHtml = `
      <html>
      <head><meta charset="UTF-8"><title>Image to Word</title></head>
      <body style="font-family: Calibri, Arial, sans-serif; line-height: 1.5;">
        <h1>Image to Word Output</h1>
        ${sections.join("\n")}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Conversion Complete</h3></div>
        <div class="result-body">
          <p class="result-info">OCR completed for ${files.length} image(s).</p>
          <a href="${url}" download="image-to-word.doc" class="btn-premium">Download Word File (.doc)</a>
        </div>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Conversion Failed</h3></div>
        <div class="result-body">
          <p class="result-info">Could not process one or more images.</p>
        </div>
      </div>
    `;
  } finally {
    setTimeout(() => {
      progressBox.style.display = "none";
    }, 300);
  }
});
