import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Anda adalah asisten AI yang bertugas mengekstrak soal pilihan ganda dari sebuah dokumen atau teks.
Tugas Anda adalah membaca seluruh isi dokumen, menemukan semua pertanyaan pilihan ganda beserta pilihan jawabannya (biasanya A, B, C, D, E), menemukan kunci jawabannya (yang mungkin berada tepat di bawah soal, ATAU dikumpulkan dalam bentuk tabel/daftar di bagian paling bawah dokumen), dan merangkum pembahasannya jika ada.

PENTING:
- Seringkali kunci jawaban diletakkan di akhir dokumen dalam bentuk tabel. Pastikan Anda membaca seluruh isi teks/dokumen sampai habis, mencocokkan nomor soal dengan kunci jawaban di tabel tersebut, dan memetakannya dengan benar!
- Kembalikan hasil HANYA dalam format JSON Array murni. Jangan tambahkan markdown \`\`\`json.
- Setiap objek dalam array harus memiliki format persis seperti ini:
{
  "text": "Teks pertanyaan (tanpa nomor)",
  "options": [
    {"label": "A", "value": "Isi pilihan A"},
    {"label": "B", "value": "Isi pilihan B"}
    // ... minimal 2 pilihan, idealnya 4 atau 5
  ],
  "correct_answer": "A", // (Huruf besar sesuai dengan kunci jawaban, misal 'A', 'B', 'C')
  "explanation": "Penjelasan/pembahasan soal jika ada di teks. Jika tidak ada, kosongkan string ini."
}
`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi di server.' }, { status: 500 });
    }

    const contentType = req.headers.get('content-type') || '';
    
    let parts: any[] = [{ text: SYSTEM_INSTRUCTION }];
    
    // Handle JSON (Direct Text Paste)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.text) {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 });
      }
      parts.push({ text: "Berikut adalah teks yang berisi kumpulan soal:\n\n" + body.text });
    } 
    // Handle File Upload (FormData)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = file.name.toLowerCase();

      if (filename.endsWith('.pdf')) {
        // Send PDF directly to Gemini
        parts.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'application/pdf'
          }
        });
        parts.push({ text: "Ekstrak soal dari dokumen PDF di atas." });
      } else if (filename.endsWith('.docx')) {
        // Extract text using mammoth first, then send to Gemini
        const result = await mammoth.extractRawText({ buffer });
        parts.push({ text: "Berikut adalah teks dari dokumen Word:\n\n" + result.value });
      } else if (filename.endsWith('.txt') || file.type === 'text/plain') {
        parts.push({ text: "Berikut adalah teks dari dokumen TXT:\n\n" + buffer.toString('utf-8') });
      } else {
        return NextResponse.json({ error: 'Format file tidak didukung. Harap gunakan PDF, DOCX, atau TXT.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    // Call Gemini AI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const outputText = response.text || '[]';
    
    // Validate output
    let parsedJson;
    try {
      parsedJson = JSON.parse(outputText);
    } catch(e) {
      console.error("Failed to parse Gemini output as JSON", outputText);
      return NextResponse.json({ error: 'Gagal membaca format jawaban AI.' }, { status: 500 });
    }

    return NextResponse.json({ questions: parsedJson });
  } catch (error: any) {
    console.error('Error parsing document with AI:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses dokumen dengan AI' }, { status: 500 });
  }
}
