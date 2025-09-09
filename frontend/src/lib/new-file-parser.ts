import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

export interface ParsedFile {
  content: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
  };
}

export class FileParser {
  static async initPDFWorker() {
    if (
      typeof window !== "undefined" &&
      !pdfjsLib.GlobalWorkerOptions.workerSrc
    ) {
      // Dynamically import worker only on client
      //@ts-ignore
      const worker = await import(
        "pdfjs-dist/legacy/build/pdf.worker.min.js?url"
      );
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
    }
  }

  static async parsePDF(file: File): Promise<ParsedFile> {
    if (typeof window === "undefined") {
      throw new Error("PDF parsing is only supported in browser environment");
    }

    try {
      // Ensure worker is initialized
      await this.initPDFWorker();

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
