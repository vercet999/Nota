// ─── docxExport.js ──────────────────────────────────────────────────────────
// Shared Word-export utilities. convertMarkdownToDocxBlob was originally
// inline in NotesView — moved here so Flashcards and Quiz can reuse it too.
// ─────────────────────────────────────────────────────────────────────────────

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export const convertMarkdownToDocxBlob = async (markdownText) => {
  const lines = markdownText.split("\n");
  const children = [];

  for (const line of lines) {
    if (line.trim() === "") {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    let isHeading = false;
    let headingLevel = null;
    let textToParse = line;
    let bullet = false;

    if (line.startsWith("### ")) {
      isHeading = true;
      headingLevel = HeadingLevel.HEADING_3;
      textToParse = line.slice(4);
    } else if (line.startsWith("## ")) {
      isHeading = true;
      headingLevel = HeadingLevel.HEADING_2;
      textToParse = line.slice(3);
    } else if (line.startsWith("# ")) {
      isHeading = true;
      headingLevel = HeadingLevel.HEADING_1;
      textToParse = line.slice(2);
    } else if (line.trim().startsWith("- ")) {
      bullet = { level: 0 };
      textToParse = line.trim().slice(2);
    }

    const textRuns = [];
    const parts = textToParse.split(/(\*\*.*?\*\*)/g);
    for (const part of parts) {
      if (part.startsWith("**") && part.endsWith("**")) {
        textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else {
        textRuns.push(new TextRun({ text: part }));
      }
    }

    const pOptions = { children: textRuns };
    if (isHeading) pOptions.heading = headingLevel;
    if (bullet) pOptions.bullet = bullet;

    children.push(new Paragraph(pOptions));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return await Packer.toBlob(doc);
};

/** Triggers a browser download for a Blob. */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Builds markdown for a flashcard deck, ready for convertMarkdownToDocxBlob. */
export function flashcardsToMarkdown(flashcards, title = "Flashcards") {
  const lines = [`# ${title}`, ""];
  flashcards.forEach((card, i) => {
    lines.push(`## ${i + 1}. ${card.term}`);
    lines.push(card.definition);
    lines.push("");
  });
  return lines.join("\n");
}

/** Builds markdown for a practice quiz, ready for convertMarkdownToDocxBlob. */
export function quizToMarkdown(quiz, title = "Practice Quiz") {
  const lines = [`# ${title}`, ""];
  quiz.forEach((q, i) => {
    lines.push(`## ${i + 1}. ${q.question}`);
    q.options.forEach((opt) => {
      const marker = opt === q.correctAnswer ? "**Correct:** " : "- ";
      lines.push(`${marker}${opt}`);
    });
    if (q.explanation) {
      lines.push("");
      lines.push(`**Explanation:** ${q.explanation}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}
