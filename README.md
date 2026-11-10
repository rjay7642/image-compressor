# ImageCompressor

<p align="center">
  <strong>Smaller files. Faster workflows. Your files stay yours.</strong><br>
  A polished, open-source collection of image and PDF tools that run right in your browser.
</p>

<p align="center">
  <a href="https://rjay7642.github.io/image-compressor/">Live website</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/rjay7642/image-compressor">Source code</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/rjay7642/image-compressor/issues">Report an issue</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Open%20Source-MIT-c9a96d?style=flat-square" alt="Open source under the MIT License">
  <img src="https://img.shields.io/badge/No%20build%20step-Static%20web-green?style=flat-square" alt="Static website with no build step">
  <img src="https://img.shields.io/badge/Processing-In%20your%20browser-28664f?style=flat-square" alt="Browser-side processing">
</p>

---

## A thoughtfully simple toolkit

ImageCompressor brings everyday image and PDF utilities together in one fast, privacy-minded website. Select a tool, drop in a file, and work with it locally in your browser—no account required.

### Image tools

- Compress JPG, PNG, and WebP images toward a target file size
- Resize, crop, rotate, and flip images
- Convert between common image formats
- Compress multiple images and download a ZIP
- Add watermarks, inspect image metadata, or create a Base64 data URL
- Turn images into PDFs or extract text from images with OCR

### PDF tools

- Convert PDF pages to images
- Merge, split, and compress PDFs
- Extract PDF content to Word with layout, text, and OCR modes

Some features use third-party browser libraries delivered by CDN. PDF compression and other integrations may depend on the implementation noted on their tool page.

## Privacy by design

Image and PDF processing is designed to happen on your device. Files are not sent to an ImageCompressor upload service for the browser-side tools. Features that rely on a remote service or third-party library are identified in the relevant tool flow; review those providers' terms before use.

## Try it locally

This is a static HTML, CSS, and JavaScript project with no build step.

```bash
git clone https://github.com/rjay7642/image-compressor.git
cd image-compressor
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). A local server is recommended over opening HTML files directly because browsers restrict some file and module APIs on `file://` pages.

## Open source & contributions

ImageCompressor is open source under the [MIT License](./LICENSE). Contributions are welcome:

1. Fork the repository and create a focused feature branch.
2. Keep changes accessible, responsive, and privacy-conscious.
3. Test the affected tool pages in a browser.
4. Open a pull request with a concise summary and test notes.

When adding a tool, update the shared navigation, relevant tool links, page metadata, and sitemap.

## Project map

```text
.
├── index.html              # Main image compressor
├── *.html                  # Tool, guide, and information pages
├── assets/
│   ├── css/style.css       # Shared interface and responsive styles
│   └── js/                 # Tool logic and shared UI behavior
├── sitemap.xml             # Search-engine sitemap
├── robots.txt
└── seo/                    # SEO resource copies
```

## Deploy

The site is published with GitHub Pages at [rjay7642.github.io/image-compressor](https://rjay7642.github.io/image-compressor/). It can also be hosted on any static host. Publish the repository root so the HTML files, `assets/`, `robots.txt`, and `sitemap.xml` remain at their expected paths.

## Built with

- HTML, CSS, and vanilla JavaScript
- PDF.js, jsPDF, PDF-Lib, JSZip, Tesseract.js, and EXIF.js for selected workflows
- Google Fonts for Plus Jakarta Sans and Space Grotesk

---

Made with care by **Jay Singh**.
