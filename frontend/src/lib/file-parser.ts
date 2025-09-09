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
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
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
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}
