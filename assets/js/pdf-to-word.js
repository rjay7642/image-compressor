const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const fileLabel = document.getElementById("fileLabel");
const dropZone = document.getElementById("dropZone");
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

let currentFile = null;

pdfInput.addEventListener("change", () => handleFile(pdfInput.files[0]));

dropZone.addEventListener("click", () => pdfInput.click());

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
    pdfInput.files = e.dataTransfer.files;
    handleFile(pdfInput.files[0]);
  }
});

function handleFile(file) {
  if (!file) return;
  currentFile = file;
  fileLabel.innerHTML = `Selected: <strong>${file.name}</strong>`;
  dropZone.classList.add("selected");
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
  if (!normalizedItems.length) return "<em>No selectable text found on this page.</em>";

  const lines = [];
  normalizedItems.forEach(item => {
    const tolerance = Math.max(3, item.fontSize * 0.42);
    let line = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (Math.abs(lines[i].y - item.top) <= tolerance) {
        line = lines[i];
        break;
      }
    }

    if (!line) {
      line = { y: item.top, items: [] };
      lines.push(line);
    }

    line.items.push(item);
  });

  lines.sort((a, b) => a.y - b.y);

  const htmlLines = [];
  let previousY = null;

  lines.forEach(line => {
    line.items.sort((a, b) => a.x - b.x);
    let lineHtml = "";
    let previousEndX = null;

    line.items.forEach(it => {
      const estimatedChar = Math.max(3.5, (it.width / Math.max(1, it.text.length)));
      if (previousEndX !== null) {
        const gap = it.x - previousEndX;
        if (gap > estimatedChar * 0.7) {
          const spaces = Math.min(12, Math.round(gap / estimatedChar));
          lineHtml += "&nbsp;".repeat(spaces);
        } else {
          lineHtml += " ";
        }
      }

      lineHtml += escapeHtml(it.text);
      previousEndX = it.x + it.width;
    });

    const paragraphGap = previousY !== null ? line.y - previousY : 0;
    if (previousY !== null && paragraphGap > 22) {
      htmlLines.push("<br>");
    }
    htmlLines.push(lineHtml.trim());
    previousY = line.y;
  });

  return htmlLines.join("<br>");
}

async function renderPageBackgroundDataUrl(page, viewport) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

function buildLayoutPageHtml(normalizedItems, viewportWidth, viewportHeight, options) {
  if (!normalizedItems.length && !options.backgroundDataUrl) {
    return "<em>No selectable text found on this page.</em>";
  }

  const textColor = options.backgroundDataUrl && !options.showOverlay ? "transparent" : "#0f172a";
  const spans = normalizedItems
    .map(item => {
      const text = escapeHtml(item.text || "");
      return `<span style="position:absolute;left:${item.x}px;top:${item.top}px;font-size:${item.fontSize}px;font-family:${item.fontFamily};font-weight:${item.fontWeight};white-space:pre;transform:rotate(${item.rotate.toFixed(2)}deg);transform-origin:left top;color:${textColor};">${text}</span>`;
    })
    .join("");

  const bg = options.backgroundDataUrl
    ? `<img src="${options.backgroundDataUrl}" alt="" style="position:absolute;left:0;top:0;width:${Math.ceil(viewportWidth)}px;height:${Math.ceil(viewportHeight)}px;">`
    : "";

  return `<div style="position:relative;width:${Math.ceil(viewportWidth)}px;height:${Math.ceil(viewportHeight)}px;border:1px solid #dbe5f1;margin:0 auto 16px;overflow:hidden;background:#fff;">${bg}${spans}</div>`;
}

async function ocrPageToHtml(page, lang, progressState) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;

  const result = await Tesseract.recognize(canvas, lang, {
    logger: m => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        const current = progressState.base + (m.progress * progressState.weight);
        progressBar.style.width = `${Math.min(100, Math.round(current))}%`;
      }
    }
  });

  const text = result && result.data && result.data.text ? result.data.text.trim() : "";
  return text ? escapeHtml(text).replace(/\n/g, "<br>") : "<em>No OCR text detected on this page.</em>";
}

function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  progressBar.style.width = `${percent}%`;
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

convertBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Please select a PDF first");
    return;
  }

  if (!window.pdfjsLib) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  output.innerHTML = "";
  progressBox.style.display = "block";
  progressBar.style.width = "0%";

  try {
    const buffer = await currentFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const mode = modeSelect ? modeSelect.value : "layout";
    const maxPagesValue = parseInt(maxPagesInput ? maxPagesInput.value : "0", 10) || 0;
    const totalPages = maxPagesValue > 0 ? Math.min(pdf.numPages, maxPagesValue) : pdf.numPages;
    const pages = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      if (mode === "ocr") {
        if (!window.Tesseract) throw new Error("OCR engine missing");

        const base = ((pageNum - 1) / totalPages) * 100;
        const html = await ocrPageToHtml(page, ocrLang ? ocrLang.value : "eng", {
          base,
          weight: 100 / totalPages
        });
        pages.push({ pageNum, html });
      } else {
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        const normalized = normalizeTextItems(textContent.items || [], textContent.styles || {}, viewport.height);

        if (mode === "layout") {
          const useBg = includeBgLayer ? includeBgLayer.checked : true;
          const backgroundDataUrl = useBg ? await renderPageBackgroundDataUrl(page, viewport) : "";
          const html = buildLayoutPageHtml(normalized, viewport.width, viewport.height, {
            backgroundDataUrl,
            showOverlay: showOverlayText ? showOverlayText.checked : false
          });
          pages.push({ pageNum, html });
        } else {
          const html = buildSmartTextHtml(normalized);
          pages.push({ pageNum, html });
        }
      }

      updateProgress(pageNum, totalPages);
    }

    const pageBlocks = pages
      .map(page => {
        if (mode === "layout") {
          return `${page.html}${includePageBreak && includePageBreak.checked ? '<div style="page-break-after: always;"></div>' : ""}`;
        }
        return `
          <div>${page.html}</div>
          ${includePageBreak && includePageBreak.checked ? '<div style="page-break-after: always;"></div>' : ""}
        `;
      })
      .join("\n");

    const docTitle = currentFile.name.replace(/\.pdf$/i, "");
    const docHtml = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(currentFile.name)}</title>
      </head>
      <body style="font-family: Calibri, Arial, sans-serif; line-height: 1.5;">
        ${pageBlocks}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);

    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Conversion Complete</h3></div>
        <div class="result-body">
          <p class="result-info">Processed ${totalPages} page(s) using <strong>${mode.toUpperCase()}</strong> mode.</p>
          <div class="notice-box">
            Best match tip: keep Auto Arrange + High fidelity background ON. OCR mode is best for scanned PDFs.
          </div>
          <a href="${url}" download="${docTitle}.doc" class="btn-premium">Download Word File (.doc)</a>
        </div>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Conversion Failed</h3></div>
        <div class="result-body">
          <p class="result-info">Could not read this PDF. Try another file.</p>
        </div>
      </div>
    `;
  } finally {
    setTimeout(() => {
      progressBox.style.display = "none";
    }, 300);
  }
});
