import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
// Polyfill for pdf-parse in Next.js environment
if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {} as any;
  }
  if (!(global as any).ImageData) {
    (global as any).ImageData = class ImageData {} as any;
  }
  if (!(global as any).Path2D) {
    (global as any).Path2D = class Path2D {} as any;
  }
}
const pdfParse = require('pdf-parse-new');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name.toLowerCase();

    let text = '';

    if (filename.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (filename.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (filename.endsWith('.doc')) {
      const WordExtractor = require('word-extractor');
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(buffer);
      text = extracted.getBody();
    } else if (filename.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please use .pdf, .docx, .doc, or .txt' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error parsing document:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse document' }, { status: 500 });
  }
}
