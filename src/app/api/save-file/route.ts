import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const filename = formData.get('filename') as string;
    const customOutputDir = formData.get('outputDir') as string;

    if (!file || !filename) {
      return NextResponse.json({ error: 'Missing file or filename' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use custom directory if provided, otherwise default to 'pdf_output' in project root
    const outputDir = customOutputDir
      ? (path.isAbsolute(customOutputDir) ? customOutputDir : path.join(process.cwd(), customOutputDir))
      : path.join(process.cwd(), 'pdf_output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
