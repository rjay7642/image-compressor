document.addEventListener("DOMContentLoaded", function () {
  const TOOL_CATALOG = [
    { href: "index.html", label: "Compress", short: "Compress", desc: "Shrink images fast without visible quality loss." },
    { href: "resize.html", label: "Resize", short: "Resize", desc: "Change dimensions in pixels with aspect lock." },
    { href: "crop.html", label: "Crop", short: "Crop", desc: "Cut exact image area using coordinates." },
    { href: "rotate.html", label: "Rotate", short: "Rotate", desc: "Rotate or flip image orientation quickly." },
    { href: "convert.html", label: "Convert", short: "Convert", desc: "Switch formats between JPG, PNG, WebP." },
    { href: "bulk-compress.html", label: "Bulk Compress", short: "Bulk", desc: "Compress many images together and download ZIP." },
    { href: "pdf-to-image.html", label: "PDF to Image", short: "PDF to Image", desc: "Extract every PDF page as a PNG image." },
    { href: "image-to-pdf.html", label: "Image to PDF", short: "Image to PDF", desc: "Merge multiple images into a single PDF." },
    { href: "pdf-merge.html", label: "PDF Merge", short: "PDF Merge", desc: "Combine multiple PDFs in order." },
    { href: "pdf-split.html", label: "PDF Split", short: "PDF Split", desc: "Split PDFs into pages." },
    { href: "pdf-compress.html", label: "PDF Compress", short: "PDF Compress", desc: "Reduce PDF file size quickly." },
    { href: "pdf-to-word.html", label: "PDF to Word", short: "PDF to Word", desc: "Extract PDF text into Word format." },
    { href: "image-to-word.html", label: "Image to Word", short: "Image to Word", desc: "Convert image text into editable Word content." },
    { href: "image-to-base64.html", label: "Image to Base64", short: "Image to Base64", desc: "Generate data URLs for code and APIs." },
    { href: "watermark.html", label: "Watermark", short: "Watermark", desc: "Protect images with text branding." },
    { href: "metadata.html", label: "Metadata", short: "Metadata", desc: "Read EXIF camera data quickly." }
  ];

  const toggleBtn = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-links");
  const dropdownToggle = document.querySelector(".nav-dropdown-toggle");

  function toolIconSvg() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M8 12h8"/><path d="M8 16h6"/></svg>`;
  }

  function ensureToolEntries() {
    const dropdownMenu = document.querySelector(".nav-dropdown");
    if (dropdownMenu) {
      const existing = new Set(Array.from(dropdownMenu.querySelectorAll("a")).map(a => (a.getAttribute("href") || "").toLowerCase()));
      TOOL_CATALOG.forEach(tool => {
        if (existing.has(tool.href)) return;
        const li = document.createElement("li");
        li.innerHTML = `<a href="${tool.href}">${tool.label}</a>`;
        dropdownMenu.appendChild(li);
      });
    }

    const switcher = document.querySelector(".tool-switcher");
    if (switcher) {
      const existing = new Set(Array.from(switcher.querySelectorAll("a")).map(a => (a.getAttribute("href") || "").toLowerCase()));
      TOOL_CATALOG.forEach(tool => {
        if (existing.has(tool.href)) return;
        const a = document.createElement("a");
        a.href = tool.href;
        a.className = "tool-btn";
        a.textContent = tool.short;
        switcher.appendChild(a);
      });
    }

    const featureGrid = document.querySelector(".feature-grid");
    if (featureGrid) {
      const existing = new Set(Array.from(featureGrid.querySelectorAll("a.feature-card")).map(a => (a.getAttribute("href") || "").toLowerCase()));
      TOOL_CATALOG.forEach(tool => {
        if (existing.has(tool.href)) return;
        const card = document.createElement("a");
        card.className = "feature-card";
        card.href = tool.href;
        card.innerHTML = `<div class="feature-icon">${toolIconSvg()}</div><h3 class="feature-title">${tool.label}</h3><p class="feature-desc">${tool.desc}</p>`;
        featureGrid.appendChild(card);
      });
    }
  }

  ensureToolEntries();
  const navLinks = document.querySelectorAll(".nav-links a, .tool-switcher a, .feature-grid a.feature-card");

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  }

  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const parent = dropdownToggle.closest(".dropdown");
      if (parent) {
        parent.classList.toggle("open");
      }
    });
  }

  document.addEventListener("click", function () {
    const parent = dropdownToggle ? dropdownToggle.closest(".dropdown") : null;
    if (parent) {
      parent.classList.remove("open");
    }
  });

  const dropdownMenu = document.querySelector(".nav-dropdown");
  if (dropdownMenu) {
    dropdownMenu.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  let dropdownActive = false;

  navLinks.forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === currentPage) {
      if (!link.classList.contains("feature-card")) {
        link.classList.add("active");
      }
      if (link.closest(".nav-dropdown")) {
        dropdownActive = true;
      }
    }
  });

  if (dropdownToggle && dropdownActive) {
    dropdownToggle.classList.add("active");
  }

  // Shared file preview for all tools, with reordering for merge-style workflows.
  const input = document.getElementById("imageInput") || document.getElementById("pdfInput");
  const dropZone = document.getElementById("dropZone");
  if (!input || !dropZone) return;

  const page = (window.location.pathname.split("/").pop() || "").toLowerCase();
  const arrangePages = new Set(["image-to-pdf.html", "pdf-merge.html", "bulk-compress.html", "image-to-word.html"]);
  const canArrange = input.multiple && arrangePages.has(page);

  const panel = document.createElement("section");
  panel.className = "selection-preview";
  panel.innerHTML = `
    <div class="selection-preview-head">
      <h3>Preview</h3>
      <p>Selected files${canArrange ? " (arrange before processing)" : ""}</p>
    </div>
    <div class="selection-preview-grid" id="selectionPreviewGrid"></div>
  `;
  dropZone.insertAdjacentElement("afterend", panel);

  const grid = panel.querySelector("#selectionPreviewGrid");
  const fileLabel = document.getElementById("fileLabel");
  const initialFileLabelHTML = fileLabel ? fileLabel.innerHTML : "";
  let orderedFiles = [];
  let objectUrls = [];

  window.getToolFiles = function (el) {
    if (!el) return [];
    if (Array.isArray(el._orderedFiles)) {
      return el._orderedFiles.slice();
    }
    return Array.from(el.files || []);
  };

  function clearObjectUrls() {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  function fileTypeLabel(file) {
    if (file.type.startsWith("image/")) return "Image";
    if (file.type === "application/pdf") return "PDF";
    return "File";
  }

  function render() {
    clearObjectUrls();
    grid.innerHTML = "";
    if (!orderedFiles.length) {
      panel.classList.remove("active");
      input._orderedFiles = [];
      if (fileLabel) {
        fileLabel.innerHTML = initialFileLabelHTML;
      }
      return;
    }

    panel.classList.add("active");
    if (fileLabel) {
      if (orderedFiles.length === 1) {
        fileLabel.innerHTML = `Selected: <strong>${orderedFiles[0].name}</strong>`;
      } else {
        fileLabel.innerHTML = `Selected: <strong>${orderedFiles.length}</strong> files`;
      }
    }
    orderedFiles.forEach((file, index) => {
      const card = document.createElement("article");
      card.className = "selection-item";

      const isImage = file.type.startsWith("image/");
      const thumb = isImage ? URL.createObjectURL(file) : "";
      if (thumb) objectUrls.push(thumb);

      card.innerHTML = `
        <div class="selection-thumb">
          ${isImage
            ? `<img src="${thumb}" alt="Preview ${index + 1}">`
            : `<div class="selection-doc">${fileTypeLabel(file)}</div>`}
        </div>
        <div class="selection-meta">
          <p class="selection-name">${file.name}</p>
          <p class="selection-size">${(file.size / 1024).toFixed(1)} KB</p>
        </div>
        ${canArrange ? `
        <div class="selection-actions">
          <button type="button" class="outline-btn move-up" data-index="${index}" ${index === 0 ? "disabled" : ""}>Up</button>
          <button type="button" class="outline-btn move-down" data-index="${index}" ${index === orderedFiles.length - 1 ? "disabled" : ""}>Down</button>
          <button type="button" class="outline-btn remove" data-index="${index}">Remove</button>
        </div>
        ` : ""}
      `;
      grid.appendChild(card);
    });

    input._orderedFiles = orderedFiles.slice();
  }

  function syncFromInput() {
    orderedFiles = Array.from(input.files || []);
    render();
  }

  input.addEventListener("change", syncFromInput);
  dropZone.addEventListener("drop", () => setTimeout(syncFromInput, 0));

  grid.addEventListener("click", event => {
    if (!canArrange) return;
    const btn = event.target.closest("button[data-index]");
    if (!btn) return;

    const index = parseInt(btn.dataset.index, 10);
    if (Number.isNaN(index)) return;

    if (btn.classList.contains("remove")) {
      orderedFiles.splice(index, 1);
    } else if (btn.classList.contains("move-up") && index > 0) {
      [orderedFiles[index - 1], orderedFiles[index]] = [orderedFiles[index], orderedFiles[index - 1]];
    } else if (btn.classList.contains("move-down") && index < orderedFiles.length - 1) {
      [orderedFiles[index + 1], orderedFiles[index]] = [orderedFiles[index], orderedFiles[index + 1]];
    }

    render();
  });

  syncFromInput();
});

