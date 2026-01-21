const imageInput = document.getElementById("imageInput");
const compressBtn = document.getElementById("compressBtn");
const output = document.getElementById("output");
const targetSizeSelect = document.getElementById("targetSize");

compressBtn.addEventListener("click", () => {

  const file = imageInput.files[0];
  if (!file) {
    alert("Please select an image first");
    return;
  }

  const targetKB = parseInt(targetSizeSelect.value);

  const reader = new FileReader();
  reader.onload = e => {

    const img = new Image();
    img.onload = () => {

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;

      function compressLoop() {
        canvas.toBlob(blob => {

          const sizeKB = blob.size / 1024;

          if (sizeKB <= targetKB || quality <= 0.1) {

            const url = URL.createObjectURL(blob);

            output.innerHTML = `
              <p><strong>Original:</strong> ${(file.size/1024).toFixed(1)} KB</p>
              <p><strong>Compressed:</strong> ${sizeKB.toFixed(1)} KB</p>

              <img src="${url}" alt="Compressed Image Preview" class="img-fluid">

              <br><br>
              <a href="${url}" download="compressed.jpg" class="btn btn-success">
                Download Image
              </a>
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
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}
