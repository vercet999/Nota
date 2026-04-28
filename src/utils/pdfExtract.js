// ─── pdfExtract.js ──────────────────────────────────────────────────────────
// Extracts plain text from PDF files using pdf.js
// Also handles plain .txt files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * extractTextFromFile
 * Accepts a File object (PDF or TXT), returns extracted text as a string
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  if (file.type === 'text/plain') {
    return await file.text()
  }

  if (file.type === 'application/pdf') {
    return await extractFromPDF(file)
  }

  throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF or .txt file.`)
}

async function extractFromPDF(file) {
  // Dynamically import pdf.js to keep initial bundle small
  const pdfjsLib = await import('pdfjs-dist')

  // Point to the worker — Vite will handle this
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item) => item.str).join(' ')
    fullText += `\n[Page ${i}]\n${pageText}\n`
  }

  return fullText.trim()
}
