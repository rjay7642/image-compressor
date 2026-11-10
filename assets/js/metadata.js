/**
 * ImageCompressor - Metadata (EXIF) Reader Engine
 * Inspects EXIF camera tags, shooting parameters, and device specs in-browser.
 */

(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const readBtn = document.getElementById("readBtn");
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

  function formatValue(val) {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "object") {
      try { return JSON.stringify(val); } catch (e) { return String(val); }
    }
    return String(val);
  }

  if (readBtn) {
    readBtn.addEventListener("click", () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose an image first", "error");
        else alert("Please select an image first");
        return;
      }

      if (!window.EXIF) {
        if (window.showToast) window.showToast("EXIF reader failed to load. Please refresh.", "error");
        return;
      }

      readBtn.disabled = true;
      readBtn.textContent = "Reading EXIF...";

      // EXIF.getData can process File/Blob directly
      EXIF.getData(file, function () {
        readBtn.disabled = false;
        readBtn.textContent = "Read Metadata";

        const allTags = EXIF.getAllTags(this) || {};
        const tagKeys = Object.keys(allTags);

        // Core fields
        const make = allTags.Make || "Unknown";
        const model = allTags.Model || "Unknown";
        const date = allTags.DateTimeOriginal || allTags.DateTime || "Not recorded";
        const iso = allTags.ISOSpeedRatings || allTags.ISO || "N/A";
        const fNumber = allTags.FNumber ? `f/${allTags.FNumber}` : "N/A";
        const exposure = allTags.ExposureTime ? `${allTags.ExposureTime.numerator || 1}/${allTags.ExposureTime.denominator || allTags.ExposureTime}s` : "N/A";
        const focal = allTags.FocalLength ? `${allTags.FocalLength}mm` : "N/A";
        const software = allTags.Software || "Default";

        const hasExif = tagKeys.length > 0;

        let tagsHtml = "";
        if (hasExif) {
          tagsHtml = tagKeys
            .sort()
            .map(k => `<li><strong>${k}</strong> <span>${formatValue(allTags[k])}</span></li>`)
            .join("");
        }

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>${hasExif ? `EXIF Metadata (${tagKeys.length} Tags)` : 'File Information'}</h3>
              <span class="badge">${hasExif ? 'EXIF Found' : 'No EXIF Data'}</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>File Name</p><strong>${file.name}</strong></div>
                <div><p>File Size</p><strong>${(file.size / 1024).toFixed(1)} KB</strong></div>
                <div><p>File Type</p><strong>${file.type || 'image'}</strong></div>
                <div><p>Camera Make</p><strong>${make}</strong></div>
                <div><p>Camera Model</p><strong>${model}</strong></div>
                <div><p>Date Taken</p><strong>${date}</strong></div>
                <div><p>Aperture</p><strong>${fNumber}</strong></div>
                <div><p>Shutter Speed</p><strong>${exposure}</strong></div>
                <div><p>ISO</p><strong>${iso}</strong></div>
                <div><p>Focal Length</p><strong>${focal}</strong></div>
                <div><p>Software</p><strong>${software}</strong></div>
              </div>

              ${hasExif ? `
                <div class="mt-3">
                  <h4 style="font-size:0.95rem; margin-bottom:10px; color:#38bdf8;">All Raw EXIF Tags</h4>
                  <ul class="meta-list">${tagsHtml}</ul>
                </div>
              ` : `
                <div class="notice-box mt-3">
                  This image does not contain embedded EXIF metadata tags (likely stripped for web privacy or saved without camera headers).
                </div>
              `}
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(hasExif ? `Found ${tagKeys.length} metadata tags!` : "File analyzed (No EXIF).", "info");
        }
      });
    });
  }
})();
