// ─── pdfExtract.js ──────────────────────────────────────────────────────────
// Extracts plain text from: PDF, TXT, DOCX, DOC, PPTX
// ─────────────────────────────────────────────────────────────────────────────

export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  const ext = name.split(".").pop();

  if (ext === "txt" || file.type === "text/plain") return await file.text();
  if (ext === "pdf" || file.type === "application/pdf") return await extractFromPDF(file);
  if (ext === "docx" || ext === "doc") return await extractFromDocx(file);
  if (ext === "pptx") return await extractFromPptx(file);

  throw new Error(
    `Unsupported file type: .${ext}. Supported formats: PDF, TXT, DOCX, DOC, PPTX`
  );
}

// ── PDF via pdf.js ────────────────────────────────────────────────────────────
async function extractFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  const MAX_PAGES = 50;
  const numPagesToExtract = Math.min(pdf.numPages, MAX_PAGES);

  for (let i = 1; i <= numPagesToExtract; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += `\n[Page ${i}]\n${pageText}\n`;
  }

  if (pdf.numPages > MAX_PAGES) {
    fullText += `\n\n[Warning: PDF exceeded ${MAX_PAGES} pages. Only the first ${MAX_PAGES} pages were extracted.]\n`;
  }

  return fullText.trim();
}

// ── DOCX / DOC via mammoth ────────────────────────────────────────────────────
async function extractFromDocx(file) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (!result.value || result.value.trim() === "") {
    throw new Error("Could not extract text from this Word document.");
  }
  return result.value.trim();
}

// ── PPTX via JSZip — unzip and parse slide XML ────────────────────────────────
async function extractFromPptx(file) {
  const JSZip = (await import("jszip")).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  if (slideFiles.length === 0) {
    throw new Error("No slides found in this PPTX file.");
  }

  let fullText = "";

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async("text");
    const text = xmlContent
      .replace(/<a:t>/g, " ")
      .replace(/<\/a:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (text) fullText += `\n[Slide ${i + 1}]\n${text}\n`;
  }

  return fullText.trim();
}