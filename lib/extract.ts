import path from "path";

export const ALLOWED_EXTENSIONS = [
  ".pdf", ".docx", ".xlsx", ".csv", ".txt", ".md",
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
];

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type Extracted = { kind: string; text: string; note: string };

export async function extractText(name: string, buffer: Buffer): Promise<Extracted> {
  const ext = path.extname(name).toLowerCase();
  try {
    if (ext === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      const text = result.text.replace(/^-- \d+ of \d+ --$/gm, "").trim();
      return {
        kind: "PDF",
        text,
        note: text ? "Text read from the PDF." : "No text found. This may be a scanned PDF (pictures of pages).",
      };
    }
    if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      return { kind: "Word", text, note: text ? "Text read from the Word file." : "No text found in this file." };
    }
    if (ext === ".xlsx") {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
      const parts: string[] = [];
      wb.eachSheet((sheet) => {
        parts.push(`Sheet: ${sheet.name}`);
        sheet.eachRow((row) => {
          const cells = (row.values as unknown[]).slice(1).map((v) => cellToText(v));
          parts.push(cells.join(" | "));
        });
      });
      const text = parts.join("\n").trim();
      return { kind: "Excel", text, note: "Text read from every sheet." };
    }
    if (ext === ".csv" || ext === ".txt" || ext === ".md") {
      return {
        kind: ext === ".csv" ? "CSV" : "Text",
        text: buffer.toString("utf8").trim(),
        note: "Text read from the file.",
      };
    }
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      return {
        kind: "Image",
        text: "",
        note: "Saved. Pictures are looked at by the AI later, so no text is pulled out now.",
      };
    }
  } catch {
    return { kind: ext.slice(1).toUpperCase(), text: "", note: "I could not read this file. It may be damaged or locked with a password." };
  }
  return { kind: "Other", text: "", note: "This kind of file is not supported." };
}

function cellToText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (o.richText) return o.richText.map((r) => r.text).join("");
    if (o.text) return String(o.text);
    if (o.result != null) return String(o.result);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
}
