import * as mammoth from "mammoth";

export interface ParsedFile {
  content: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
  };
}

let workerInitialized = false; // track worker setup

export class FileParser {
  /**
   * Parse a PDF file using pdf.js (lazy-loaded)
   */
  static async parsePDF(file: File): Promise<ParsedFile> {
    if (typeof window === "undefined") {
      return {
        content: `[PDF parsing skipped on server for ${file.name}]`,
        metadata: { pages: 0, wordCount: 0 },
      };
    }

    // Lazy-load pdf.js only when needed
    const pdfjsLib = await import("pdfjs-dist");

    if (!workerInitialized) {
      // Use the worker from the public directory (served locally)
      // This avoids CORS and CDN issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs";
      workerInitialized = true;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      const numPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      }

      const cleanText = fullText.trim();
      return {
        content: cleanText,
        metadata: {
          pages: numPages,
          wordCount: cleanText.split(/\s+/).filter((w) => w.length > 0).length,
        },
      };
    } catch (error) {
      console.error("PDF parsing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: `[PDF parsing failed for ${file.name}: ${errorMessage}]`,
        metadata: { pages: 0, wordCount: 0 },
      };
    }
  }

  /**
   * Parse a DOCX file using mammoth
   */
  static async parseDocx(file: File): Promise<ParsedFile> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      content: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).filter((w) => w.length > 0).length,
      },
    };
  }

  /**
   * Parse a DOC file using mammoth
   */
  static async parseDoc(file: File): Promise<ParsedFile> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      content: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).filter((w) => w.length > 0).length,
      },
    };
  }

  /**
   * Parse a CSV file using PapaParse
   */
  static async parseCSV(file: File): Promise<ParsedFile> {
    const Papa = (await import("papaparse")).default;

    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          const headers = results.meta.fields ?? [];

          const lines: string[] = [headers.join(" | ")];
          for (const row of rows) {
            lines.push(headers.map((h) => row[h] ?? "").join(" | "));
          }

          const content = lines.join("\n");
          resolve({
            content,
            metadata: {
              wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
            },
          });
        },
        error: (error) => {
          resolve({
            content: `[CSV parsing failed for ${file.name}: ${error.message}]`,
            metadata: { wordCount: 0 },
          });
        },
      });
    });
  }

  /**
   * Parse an Excel file (.xlsx / .xls) using SheetJS
   */
  static async parseExcel(file: File): Promise<ParsedFile> {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sections: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv.trim()) {
        sections.push(`[Sheet: ${sheetName}]\n${csv}`);
      }
    }

    const content = sections.join("\n\n");
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
      },
    };
  }

  /**
   * Detect file type and parse accordingly
   */
  static async parseFile(file: File): Promise<ParsedFile> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return this.parsePDF(file);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return this.parseDocx(file);
    } else if (fileType === "application/msword" || fileName.endsWith(".doc")) {
      return this.parseDoc(file);
    } else if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return this.parseCSV(file);
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    ) {
      return this.parseExcel(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}
