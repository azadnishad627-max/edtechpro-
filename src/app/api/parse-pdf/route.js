import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf");
    if (!file) return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extractedText = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1);
      pdfParser.on("pdfParser_dataError", errData => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({ text: extractedText });
  } catch (err) {
    console.error("PDF Parse Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
