# ImageCompressor - All-in-One Browser-Based File Tools

ImageCompressor is a frontend-first toolkit for image and PDF workflows.  
It provides fast, privacy-friendly processing directly in the browser for common tasks such as compression, conversion, PDF utilities, OCR-based extraction, and batch operations.

## Key Highlights

- Browser-side processing for most tools (no mandatory server upload).
- Modern multi-tool interface with shared UI components.
- Drag-and-drop uploads with file preview support.
- Reordering support for multi-file workflows.
- Batch export options including ZIP downloads.
- SEO-ready static pages with metadata and sitemap entries.

## Available Tools

### Image Tools
- Image Compress
- Bulk Image Compress (ZIP export)
- Image Resize
- Image Crop
- Image Rotate / Flip
- Image Convert (JPG/PNG/WebP)
- Watermark
- Metadata Reader
- Image to Base64
- Image to PDF
- Image to Word (OCR)

### PDF Tools
- PDF to Image (multi-PDF + ZIP export)
- PDF Merge
- PDF Split
- PDF Compress (API-dependent route)
- PDF to Word (Auto Arrange, Text, OCR modes)

## PDF to Word Modes

The PDF-to-Word converter supports multiple strategies:

- `Auto Arrange (PDF-like layout)`  
  Attempts to preserve text placement and page layout.
- `Text Mode`  
  Faster plain text extraction with smart spacing/line grouping.
- `OCR Mode`  
  For scanned PDFs where text is embedded in images.

Optional high-fidelity controls are included for better visual match.

## Project Structure

```text
.
|-- index.html
|-- *.html                     # Tool pages
|-- assets/
|   |-- css/
|   |   `-- style.css
|   `-- js/
|       |-- ui.js              # Shared UI behavior (nav, previews, tool sync helpers)
|       |-- compressor.js
|       |-- pdf-to-word.js
|       |-- pdf-to-image.js
|       `-- ...other tool scripts
|-- sitemap.xml
`-- seo/
    |-- sitemap.xml
    `-- robots.txt
```

## How to Run Locally

This is a static web project.

1. Clone the repository.
2. Open `index.html` directly in a browser.
3. For best compatibility (and to avoid local file restrictions), run through a local static server:
   - VS Code Live Server, or
   - `python -m http.server`, or
   - any static hosting server.

## External Libraries Used

Some features rely on CDN libraries:

- `pdf.js` for PDF parsing/rendering.
- `jsPDF` for PDF generation.
- `PDF-Lib` for PDF merge/split workflows.
- `JSZip` for ZIP generation.
- `Tesseract.js` for OCR.
- `EXIF.js` for metadata extraction.

## Privacy Note

Most tools run fully client-side.  
However, any server-backed endpoint (for example PDF compress API route if configured) should be documented and secured in deployment.

## Browser Compatibility

Recommended:
- Latest Chrome / Edge
- Latest Firefox
- Safari (recent versions)

Older browsers may have limited support for modern file APIs, canvas, or OCR performance.

## Deployment

You can deploy this as a static site on platforms such as:
- GitHub Pages
- Netlify
- Vercel (static)
- Any Nginx/Apache static host

Ensure CDN scripts are reachable in production environments.

## Roadmap Ideas

- DOCX-native export for improved Word compatibility.
- Better table/column reconstruction for PDF-to-Word.
- Per-tool history panel and export presets.
- Worker-based processing for heavy tasks and smoother UX on large files.

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request

If you add a new tool page, also update:
- tool navigation links
- feature cards (or shared tool catalog)
- sitemap files
- relevant metadata
