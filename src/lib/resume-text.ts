import mammoth from "mammoth";

// Extracts plain text from a resume file buffer for the live parse-on-upload
// preview in ApplyForm's onboarding wizard. Mirrors staffanchor-crm's
// src/lib/resume-text.ts exactly (same PDF/DOCX support, same pdf-parse
// import workaround) since both apps need the identical extraction behavior.
export async function extractResumeText(buffer: ArrayBuffer, fileName: string): Promise<string | null> {
  try {
    if (/\.pdf$/i.test(fileName)) {
      // Importing the package root (pdf-parse/index.js) runs a debug-mode
      // branch on load that tries to synchronously read a hardcoded sample
      // file whenever it can't detect module.parent -- always the case once
      // bundled by Next.js/Turbopack. Importing the inner lib module
      // directly skips that debug branch (see CRM's identical fix).
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const result = await pdfParse(Buffer.from(buffer));
      return result.text?.trim() || null;
    }
    if (/\.docx$/i.test(fileName)) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return result.value?.trim() || null;
    }
    return null;
  } catch (err) {
    console.error("Resume text extraction failed", err);
    return null;
  }
}
