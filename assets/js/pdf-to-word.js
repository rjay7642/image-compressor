/**
 * ImageCompressor - PDF to Word Engine
 * Supports Layout Preserve, Fast Text Extraction, and Tesseract OCR for scanned documents.
 */

(function () {
  "use strict";

  const pdfInput = document.getElementById("pdfInput");
  const convertBtn = document.getElementById("convertBtn");
  const output = document.getElementById("output");
  const progressBox = document.getElementById("progressBox");
  const progressBar = document.getElementById("progressBar");
  const modeSelect = document.getElementById("modeSelect");
  const ocrLang = document.getElementById("ocrLang");
  const maxPagesInput = document.getElementById("maxPages");
  const includePageBreak = document.getElementById("includePageBreak");
  const includeBgLayer = document.getElementById("includeBgLayer");
  const showOverlayText = document.getElementById("showOverlayText");

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function getSelectedFile() {
    if (window.getToolFiles) {
      const list = window.getToolFiles(pdfInput);
      if (list && list.length > 0) return list[0];
    }
    if (pdfInput && pdfInput.files && pdfInput.files.length > 0) {
      return pdfInput.files[0];
    }
    return null;
  }

  if (pdfInput) {
    pdfInput.addEventListener("change", () => {
      if (output) output.innerHTML = "";
    });
  }

  function updateModeUI() {
    if (!modeSelect) return;
    const isOCR = modeSelect.value === "ocr";
    const isLayout = modeSelect.value === "layout";

    if (ocrLang) ocrLang.disabled = !isOCR;
    if (includeBgLayer) includeBgLayer.disabled = !isLayout;
    if (showOverlayText) showOverlayText.disabled = !isLayout;
  }

  if (modeSelect) {
    modeSelect.addEventListener("change", updateModeUI);
    updateModeUI();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeFontFamily(name) {
    if (!name) return "Calibri, Arial, sans-serif";
    return String(name).replace(/[^a-zA-Z0-9 ,\-]/g, "");
  }

  function normalizeTextItems(items, styles, viewportHeight) {
    return (items || [])
      .filter(item => item && item.str && item.str.trim())
      .map(item => {
        const tx = item.transform || [1, 0, 0, 1, 0, 0];
        const x = tx[4] || 0;
        const y = tx[5] || 0;
        const rawFont = Math.hypot(tx[0] || 0, tx[1] || 0);
        const fontSize = Math.max(8, Math.min(56, Math.abs(item.height || rawFont || 12)));
        const width = Math.max(2, item.width || (item.str.length * fontSize * 0.45));
        const top = Math.max(0, viewportHeight - y - fontSize * 0.85);
        const rotate = Math.atan2(tx[1] || 0, tx[0] || 1) * (180 / Math.PI);
        const styleDef = styles && item.fontName ? styles[item.fontName] : null;

        return {
          text: item.str,
          x,
          y,
          top,
          width,
          fontSize,
          rotate,
          fontFamily: safeFontFamily(styleDef && styleDef.fontFamily ? styleDef.fontFamily : "Calibri, Arial, sans-serif"),
          fontWeight: styleDef && styleDef.fontWeight ? styleDef.fontWeight : "400"
        };
      })
      .sort((a, b) => a.top - b.top || a.x - b.x);
  }

  function buildSmartTextHtml(normalizedItems) {
    if (!normalizedItems.length) return "<p><em>No selectable text found on this page.</em></p>";
    return `<p style="line-height:1.6; margin-bottom:14px;">${normalizedItems.map(it => escapeHtml(it.text)).join(" ")}</p>`;
  }

  async function renderPageBg(page, viewport) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  }

  function buildLayoutPageHtml(normalizedItems, width, height, options) {
    const textColor = options.backgroundDataUrl && !options.showOverlay ? "transparent" : "#0f172a";
    const spans = normalizedItems
      .map(item => {
        const text = escapeHtml(item.text || "");
        return `<span style="position:absolute;left:${item.x}px;top:${item.top}px;font-size:${item.fontSize}px;font-family:${item.fontFamily};white-space:pre;color:${textColor};">${text}</span>`;
      })
      .join("");

    const bg = options.backgroundDataUrl
      ? `<img src="${options.backgroundDataUrl}" alt="" style="position:absolute;left:0;top:0;width:${Math.ceil(width)}px;height:${Math.ceil(height)}px;">`
      : "";

    return `<div style="position:relative;width:${Math.ceil(width)}px;height:${Math.ceil(height)}px;margin:0 auto 16px;background:#fff;border:1px solid #e2e8f0;">${bg}${spans}</div>`;
  }

  async function ocrPage(page, lang) {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const result = await Tesseract.recognize(canvas, lang);
    const text = result && result.data && result.data.text ? result.data.text.trim() : "";
    return text ? `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>` : "<p><em>No OCR text detected.</em></p>";
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", async () => {
      const file = getSelectedFile();
      if (!file) {
        if (window.showToast) window.showToast("Please choose a PDF file first", "error");
        else alert("Please select a PDF first");
        return;
      }

      if (!window.pdfjsLib) {
        if (window.showToast) window.showToast("PDF parser failed to load. Please refresh.", "error");
        return;
      }

      convertBtn.disabled = true;
      convertBtn.textContent = "Converting to Word...";
      output.innerHTML = "";

      if (progressBox) progressBox.style.display = "block";
      if (progressBar) progressBar.style.width = "0%";

      try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const mode = modeSelect ? modeSelect.value : "layout";
        const maxPages = parseInt(maxPagesInput ? maxPagesInput.value : "0", 10) || 0;
        const totalPages = maxPages > 0 ? Math.min(pdf.numPages, maxPages) : pdf.numPages;
        const pageHtmls = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);

          if (mode === "ocr") {
            if (!window.Tesseract) throw new Error("OCR engine missing");
            const html = await ocrPage(page, ocrLang ? ocrLang.value : "eng");
            pageHtmls.push(html);
          } else {
            const viewport = page.getViewport({ scale: 1 });
            const textContent = await page.getTextContent();
            const items = normalizeTextItems(textContent.items || [], textContent.styles || {}, viewport.height);

            if (mode === "layout") {
              const useBg = includeBgLayer ? includeBgLayer.checked : true;
              const bgUrl = useBg ? await renderPageBg(page, viewport) : "";
              const html = buildLayoutPageHtml(items, viewport.width, viewport.height, {
                backgroundDataUrl: bgUrl,
                showOverlay: showOverlayText ? showOverlayText.checked : false
              });
              pageHtmls.push(html);
            } else {
              pageHtmls.push(buildSmartTextHtml(items));
            }
          }

          const pct = Math.round((pageNum / totalPages) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
        }

        const separator = includePageBreak && includePageBreak.checked ? '<div style="page-break-after: always;"></div>' : '';
        const bodyContent = pageHtmls.join(separator);

        const docTitle = file.name.replace(/\.pdf$/i, "");
        const docHtml = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>${escapeHtml(file.name)}</title>
          </head>
          <body style="font-family: Calibri, Arial, sans-serif; padding: 20px;">
            ${bodyContent}
          </body>
          </html>
        `;

        const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const sizeKB = (blob.size / 1024).toFixed(1);

        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3>Conversion to Word Complete</h3>
              <span class="badge">${mode.toUpperCase()} Mode</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div><p>Input Document</p><strong>${file.name}</strong></div>
                <div><p>Converted Pages</p><strong>${totalPages} Pages</strong></div>
                <div><p>Word Doc Size</p><strong>${sizeKB} KB</strong></div>
              </div>

              <div class="d-flex justify-content-center mt-3">
                <a href="${url}" download="${docTitle}.doc" class="btn-premium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Word Document (.doc)
                </a>
              </div>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast(`Converted ${totalPages} pages to Word!`, "success");
        }
      } catch (err) {
        console.error("PDF to Word failed:", err);
        output.innerHTML = `
          <div class="result-card">
            <div class="result-header">
              <h3 style="color:#f43f5e;">Conversion Failed</h3>
            </div>
            <div class="result-body">
              <p class="text-muted">Could not parse this PDF into Word format. Try switching mode to Text or OCR.</p>
            </div>
          </div>
        `;
        if (window.showToast) window.showToast("Failed to convert PDF to Word", "error");
      } finally {
        if (progressBox) progressBox.style.display = "none";
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert to Word";
      }
    });
  }
})();
