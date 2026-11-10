/**
 * ImageCompressor - Shared UI & State Engine
 * Handles navigation, mobile drawer, tool catalog sync,
 * centralized drag-and-drop, multi-file reordering/removal, and toast notifications.
 */

(function () {
  "use strict";

  // Toast Notification System
  window.showToast = function (message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // Tool Catalog Definition with Modern SVG Icons
  const TOOL_CATALOG = [
    {
      href: "index.html",
      label: "Image Compress",
      short: "Compress",
      desc: "Shrink images fast without visible quality loss.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7"/></svg>`
    },
    {
      href: "resize.html",
      label: "Image Resize",
      short: "Resize",
      desc: "Change dimensions in pixels with aspect ratio lock.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`
    },
    {
      href: "crop.html",
      label: "Image Crop",
      short: "Crop",
      desc: "Cut exact image area using presets or coordinates.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg>`
    },
    {
      href: "rotate.html",
      label: "Rotate & Flip",
      short: "Rotate",
      desc: "Rotate 90°/180° or flip images horizontally and vertically.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
    },
    {
      href: "convert.html",
      label: "Format Convert",
      short: "Convert",
      desc: "Switch between modern JPG, PNG, and WebP formats.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>`
    },
    {
      href: "bulk-compress.html",
      label: "Bulk Compress",
      short: "Bulk",
      desc: "Compress multiple images together and download all as a ZIP.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
    },
    {
      href: "pdf-to-image.html",
      label: "PDF to Image",
      short: "PDF to Image",
      desc: "Extract every PDF page as high-res PNG images.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13l2 2 4-4"/></svg>`
    },
    {
      href: "image-to-pdf.html",
      label: "Image to PDF",
      short: "Image to PDF",
      desc: "Merge multiple images into a single clean PDF document.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
    },
    {
      href: "pdf-merge.html",
      label: "PDF Merge",
      short: "PDF Merge",
      desc: "Combine multiple PDF files into one in custom order.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`
    },
    {
      href: "pdf-split.html",
      label: "PDF Split",
      short: "PDF Split",
      desc: "Split multi-page PDFs into individual separate documents.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`
    },
    {
      href: "pdf-compress.html",
      label: "PDF Compress",
      short: "PDF Compress",
      desc: "Reduce heavy PDF file size quickly without losing legibility.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7"/></svg>`
    },
    {
      href: "pdf-to-word.html",
      label: "PDF to Word",
      short: "PDF to Word",
      desc: "Convert PDF documents to editable Word (.doc) with layout preservation.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
    },
    {
      href: "image-to-word.html",
      label: "Image to Word (OCR)",
      short: "Image to Word",
      desc: "Extract text from photos and screenshots using client-side OCR.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`
    },
    {
      href: "image-to-base64.html",
      label: "Image to Base64",
      short: "Base64",
      desc: "Generate clean data URLs for web development and APIs.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
    },
    {
      href: "watermark.html",
      label: "Watermark Tool",
      short: "Watermark",
      desc: "Protect your images with customizable branding and copyright text.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    },
    {
      href: "metadata.html",
      label: "Metadata (EXIF)",
      short: "Metadata",
      desc: "Read detailed camera settings, aperture, ISO, and device EXIF tags.",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    }
  ];

  /**
   * Universal File Getter
   * CRITICAL BUG FIX: Checks _orderedFiles FIRST so reordering or removing items in UI takes immediate effect!
   */
  window.getToolFiles = function (el) {
    if (!el) return [];
    if (Array.isArray(el._orderedFiles)) {
      return el._orderedFiles.slice();
    }
    if (el.files && el.files.length > 0) {
      return Array.from(el.files);
    }
    return [];
  };

  /**
   * Helper to sync DataTransfer files to HTMLInputElement if supported
   */
  function syncDataTransferToInput(input, filesArray) {
    try {
      if (window.DataTransfer) {
        const dt = new DataTransfer();
        filesArray.forEach(file => dt.items.add(file));
        input.files = dt.files;
      }
    } catch (err) {
      // Ignored if browser restricts DataTransfer assignment
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

    // 1. Ensure Navigation Dropdown & Tool Switcher are fully populated
    const dropdownMenu = document.querySelector(".nav-dropdown");
    if (dropdownMenu) {
      const existing = new Set(Array.from(dropdownMenu.querySelectorAll("a")).map(a => (a.getAttribute("href") || "").toLowerCase()));
      TOOL_CATALOG.forEach(tool => {
        if (!existing.has(tool.href)) {
          const li = document.createElement("li");
          li.innerHTML = `<a href="${tool.href}">${tool.label}</a>`;
          dropdownMenu.appendChild(li);
        }
      });
    }

    const switcher = document.querySelector(".tool-switcher");
    if (switcher) {
      const existing = new Set(Array.from(switcher.querySelectorAll("a")).map(a => (a.getAttribute("href") || "").toLowerCase()));
      TOOL_CATALOG.forEach(tool => {
        if (!existing.has(tool.href)) {
          const a = document.createElement("a");
          a.href = tool.href;
          a.className = "tool-btn";
          a.textContent = tool.short;
          switcher.appendChild(a);
        }
      });

      // Wrap switcher for smooth horizontal scrolling if not already wrapped
      if (!switcher.parentElement.classList.contains("tool-switcher-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "tool-switcher-wrapper";
        switcher.parentNode.insertBefore(wrapper, switcher);
        wrapper.appendChild(switcher);
      }

      // Auto-scroll the active button into center view
      setTimeout(() => {
        const activeBtn = switcher.querySelector(".tool-btn.active");
        if (activeBtn) {
          activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 100);
    }

    // 2. Mobile Navigation Toggle & Hamburger
    const toggleBtn = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-links");
    const dropdownToggle = document.querySelector(".nav-dropdown-toggle");

    if (toggleBtn && navMenu) {
      // Ensure animated icon inside toggle
      if (!toggleBtn.querySelector(".nav-toggle-icon")) {
        toggleBtn.innerHTML = `
          <div class="nav-toggle-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        `;
      }

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleBtn.classList.toggle("active");
        navMenu.classList.toggle("active");
      });

      // Close mobile menu on outside click
      document.addEventListener("click", function (e) {
        if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
          navMenu.classList.remove("active");
          toggleBtn.classList.remove("active");
        }
      });
    }

    if (dropdownToggle) {
      dropdownToggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const parent = dropdownToggle.closest(".dropdown");
        if (parent) {
          parent.classList.toggle("open");
        }
      });
    }

    // Mark active link
    const allLinks = document.querySelectorAll(".nav-links a, .tool-switcher a, .nav-dropdown a");
    allLinks.forEach(link => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href === currentPage) {
        link.classList.add("active");
        if (link.closest(".nav-dropdown") && dropdownToggle) {
          dropdownToggle.classList.add("active");
        }
      }
    });

    // 3. Centralized DropZone & Preview Manager
    const input = document.getElementById("imageInput") || document.getElementById("pdfInput");
    const dropZone = document.getElementById("dropZone");
    const fileLabel = document.getElementById("fileLabel");
    const initialLabelHTML = fileLabel ? fileLabel.innerHTML : "";

    if (!input || !dropZone) return;

    // Check if current page allows reordering
    const arrangePages = new Set([
      "image-to-pdf.html",
      "pdf-merge.html",
      "bulk-compress.html",
      "image-to-word.html",
      "pdf-to-image.html"
    ]);
    const canArrange = input.multiple || arrangePages.has(currentPage);

    // Build Preview Panel
    let panel = document.querySelector(".selection-preview");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "selection-preview";
      panel.innerHTML = `
        <div class="selection-preview-head">
          <h3>Selected Files</h3>
          <p id="selectionCount">0 files chosen${canArrange ? " • Drag or use arrows to reorder" : ""}</p>
        </div>
        <div class="selection-preview-grid" id="selectionPreviewGrid"></div>
      `;
      dropZone.insertAdjacentElement("afterend", panel);
    }

    const grid = panel.querySelector("#selectionPreviewGrid");
    const countText = panel.querySelector("#selectionCount");
    let orderedFiles = [];
    let objectUrls = [];

    function clearObjectUrls() {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      objectUrls = [];
    }

    function renderPreviews() {
      clearObjectUrls();
      grid.innerHTML = "";

      if (!orderedFiles.length) {
        panel.classList.remove("active");
        dropZone.classList.remove("selected");
        input._orderedFiles = [];
        syncDataTransferToInput(input, []);
        if (fileLabel) fileLabel.innerHTML = initialLabelHTML;
        return;
      }

      panel.classList.add("active");
      dropZone.classList.add("selected");
      input._orderedFiles = orderedFiles.slice();
      syncDataTransferToInput(input, orderedFiles);

      if (fileLabel) {
        if (orderedFiles.length === 1) {
          fileLabel.innerHTML = `Selected: <strong>${orderedFiles[0].name}</strong>`;
        } else {
          fileLabel.innerHTML = `Selected: <strong>${orderedFiles.length} files</strong>`;
        }
      }

      if (countText) {
        countText.textContent = `${orderedFiles.length} file${orderedFiles.length > 1 ? "s" : ""} selected${canArrange ? " • Arrange before processing" : ""}`;
      }

      orderedFiles.forEach((file, index) => {
        const item = document.createElement("article");
        item.className = "selection-item";

        const isImage = file.type.startsWith("image/");
        let thumbUrl = "";
        if (isImage) {
          thumbUrl = URL.createObjectURL(file);
          objectUrls.push(thumbUrl);
        }

        item.innerHTML = `
          <div class="selection-thumb">
            ${isImage
              ? `<img src="${thumbUrl}" alt="Preview ${index + 1}">`
              : `<div class="selection-doc">${file.type === "application/pdf" ? "PDF" : "FILE"}</div>`}
          </div>
          <div class="selection-meta">
            <p class="selection-name" title="${file.name}">${file.name}</p>
            <p class="selection-size">${(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div class="selection-actions">
            ${canArrange ? `
              <button type="button" class="outline-btn move-up" data-index="${index}" title="Move Up" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" class="outline-btn move-down" data-index="${index}" title="Move Down" ${index === orderedFiles.length - 1 ? "disabled" : ""}>↓</button>
            ` : ""}
            <button type="button" class="outline-btn remove" data-index="${index}" title="Remove file">✕</button>
          </div>
        `;
        grid.appendChild(item);
      });
    }

    function syncFiles(newFiles) {
      if (!newFiles || !newFiles.length) {
        orderedFiles = [];
      } else {
        if (input.multiple) {
          orderedFiles = Array.from(newFiles);
        } else {
          orderedFiles = [newFiles[0]];
        }
      }
      renderPreviews();
    }

    // 4. Centralized DropZone Events
    // Prevent duplicate triggers across different scripts
    dropZone.addEventListener("click", function (e) {
      if (e.target !== input) {
        input.click();
      }
    });

    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        syncFiles(e.dataTransfer.files);
        // Dispatch standard change event
        input.dispatchEvent(new Event("change", { bubbles: true }));
        window.showToast(`${e.dataTransfer.files.length} file(s) loaded`, "info");
      }
    });

    input.addEventListener("change", function () {
      if (input.files && input.files.length) {
        syncFiles(input.files);
      }
    });

    // 5. Reorder & Remove Actions
    grid.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-index]");
      if (!btn) return;

      const idx = parseInt(btn.dataset.index, 10);
      if (Number.isNaN(idx)) return;

      if (btn.classList.contains("remove")) {
        const removed = orderedFiles.splice(idx, 1);
        renderPreviews();
        input.dispatchEvent(new Event("change", { bubbles: true }));
        if (removed.length) {
          window.showToast(`Removed "${removed[0].name}"`, "info");
        }
      } else if (btn.classList.contains("move-up") && idx > 0) {
        const temp = orderedFiles[idx - 1];
        orderedFiles[idx - 1] = orderedFiles[idx];
        orderedFiles[idx] = temp;
        renderPreviews();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (btn.classList.contains("move-down") && idx < orderedFiles.length - 1) {
        const temp = orderedFiles[idx + 1];
        orderedFiles[idx + 1] = orderedFiles[idx];
        orderedFiles[idx] = temp;
        renderPreviews();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Initial check in case files were already populated
    if (input.files && input.files.length) {
      syncFiles(input.files);
    }
  });
})();
