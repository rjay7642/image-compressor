/**
 * ImageCompressor - Image to Base64 Engine
 * Generates ready-to-use Base64 DataURIs, HTML image tags, and CSS background snippets.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const convertBtn = document.getElementById("convertBtn");
  const output = document.getElementById("output");

  function getSelectedFile() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(imageInput);
      if (list && list.length > 0) return list[0];
    }
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      return imageInput.files[0];
    }
    return null;
  }

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      convertBtn.disabled = true;
      convertBtn.textContent = "Encoding...";

      const reader = new FileReader();
      reader.onload = () => {
        convertBtn.disabled = false;
        convertBtn.textContent = "Generate Base64";

        const dataUrl = reader.result;
        const imgTag = `<img src="${dataUrl}" alt="${file.name}">`;
        const cssBg = `background-image: url("${dataUrl}");`;

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>Base64 Data URI Generated</h3>
              <span class="badge">${(dataUrl.length / 1024).toFixed(1)} KB Text</span>
            </div>

            <div class="result-body">
              <div class="preset-chips mb-2" id="formatTabs">
                <button type="button" class="preset-chip active" data-type="raw">Raw Data URI</button>
                <button type="button" class="preset-chip" data-type="html">HTML &lt;img&gt; Tag</button>
                <button type="button" class="preset-chip" data-type="css">CSS background-image</button>
              </div>

              <textarea class="base64-area" id="base64Output" readonly>${dataUrl}</textarea>

              <div class="d-flex justify-content-center mt-3">
                <button type="button" class="btn-premium" id="copyBase64Btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        `;

        const textarea = document.getElementById("base64Output");
        const copyBtn = document.getElementById("copyBase64Btn");
        const formatTabs = document.getElementById("formatTabs");

        let activeText = dataUrl;

        if (formatTabs) {
          formatTabs.querySelectorAll(".preset-chip").forEach(tab => {
            tab.addEventListener("click", () => {
              formatTabs.querySelectorAll(".preset-chip").forEach(t => t.classList.remove("active"));
              tab.classList.add("active");

              const type = tab.dataset.type;
              if (type === "html") activeText = imgTag;
              else if (type === "css") activeText = cssBg;
              else activeText = dataUrl;

              textarea.value = activeText;
            });
          });
        }

        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(activeText).then(() => {
              copyBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Copied to Clipboard!
              `;
              if (window.showToast) window.showToast("Copied to clipboard!", "success");

              setTimeout(() => {
                copyBtn.innerHTML = `
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy to Clipboard
                `;
              }, 2000);
            });
          });
        }

        if (window.showToast) window.showToast("Base64 string ready!", "success");
      };

      reader.readAsDataURL(file);
    });
  }
})();
