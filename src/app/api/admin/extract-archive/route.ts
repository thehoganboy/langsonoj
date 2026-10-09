import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createExtractorFromData } from 'node-unrar-js';

export const dynamic = 'force-dynamic';

interface ExtractedFile {
  path: string;
  name: string;
  content: string;
}

function naturalSortCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function pairTestcases(files: ExtractedFile[]) {
  // 1. Cấu trúc Themis: Mỗi testcase nằm trong 1 folder riêng (Test01/, Test02/...)
  const folderMap: Record<string, ExtractedFile[]> = {};
  for (const file of files) {
    const parts = file.path.split(/[/\\]/);
    if (parts.length >= 2) {
      const folderName = parts[parts.length - 2];
      if (!folderMap[folderName]) folderMap[folderName] = [];
      folderMap[folderName].push(file);
    }
  }

  const validFolders = Object.keys(folderMap).filter((f) => folderMap[f].length >= 2);
  if (validFolders.length > 0) {
    validFolders.sort(naturalSortCompare);
    const testcases: { input: string; output: string; isSample: boolean; explanation?: string }[] = [];

    for (let i = 0; i < validFolders.length; i++) {
      const folderName = validFolders[i];
      const folderFiles = folderMap[folderName];

      let inFile: ExtractedFile | null = null;
      let outFile: ExtractedFile | null = null;

      for (const f of folderFiles) {
        const lower = f.name.toLowerCase();
        if (
          lower.endsWith('.inp') ||
          lower.endsWith('.in') ||
          lower.includes('input') ||
          lower.includes('.in.')
        ) {
          inFile = f;
        } else if (
          lower.endsWith('.out') ||
          lower.endsWith('.ans') ||
          lower.includes('output') ||
          lower.includes('.out.')
        ) {
          outFile = f;
        }
      }

      if (!inFile && folderFiles.length >= 2) inFile = folderFiles[0];
      if (!outFile && folderFiles.length >= 2) outFile = folderFiles[1];

      if (inFile && outFile) {
        const lower = folderName.toLowerCase();
        const isSampleExplicit = lower.includes('sample') || lower.includes('mau');
        const isSample = isSampleExplicit || i < 2;

        testcases.push({
          input: inFile.content.trim(),
          output: outFile.content.trim(),
          isSample,
          explanation: isSample ? `Test mẫu (${folderName})` : undefined,
        });
      }
    }

    if (testcases.length > 0) {
      return {
        testcases,
        totalDetected: testcases.length,
        detectedFormat: 'Themis (Mỗi test một thư mục riêng: Test01, Test02...)',
      };
    }
  }

  // 2. Cấu trúc phẳng: Cặp tệp tương ứng (1.in / 1.out, test1.inp / test1.out, ...)
  const pairsMap: Record<string, { in?: string; out?: string }> = {};
  for (const file of files) {
    const lower = file.name.toLowerCase();
    let isInput = false;
    let isOutput = false;
    let baseKey = '';

    if (lower.endsWith('.inp') || lower.endsWith('.in')) {
      isInput = true;
      baseKey = file.name.replace(/\.(inp|in)$/i, '');
    } else if (lower.endsWith('.out') || lower.endsWith('.ans')) {
      isOutput = true;
      baseKey = file.name.replace(/\.(out|ans)$/i, '');
    } else if (lower.includes('input')) {
      isInput = true;
      baseKey = lower.replace('input', '').replace(/\.[^.]+$/, '');
    } else if (lower.includes('output') || lower.includes('ans')) {
      isOutput = true;
      baseKey = lower.replace(/(output|ans)/, '').replace(/\.[^.]+$/, '');
    }

    if (baseKey) {
      baseKey = baseKey.trim();
      if (!pairsMap[baseKey]) pairsMap[baseKey] = {};
      if (isInput) pairsMap[baseKey].in = file.content.trim();
      if (isOutput) pairsMap[baseKey].out = file.content.trim();
    }
  }

  const validKeys = Object.keys(pairsMap).filter((k) => pairsMap[k].in && pairsMap[k].out);
  if (validKeys.length > 0) {
    validKeys.sort(naturalSortCompare);
    const testcases: { input: string; output: string; isSample: boolean; explanation?: string }[] = [];

    for (let i = 0; i < validKeys.length; i++) {
      const key = validKeys[i];
      const pair = pairsMap[key];
      const lowerKey = key.toLowerCase();
      const isSampleExplicit = lowerKey.includes('sample') || lowerKey.includes('mau');
      const isSample = isSampleExplicit || i < 2;

      testcases.push({
        input: pair.in!,
        output: pair.out!,
        isSample,
        explanation: isSample ? `Test mẫu (${key})` : undefined,
      });
    }

    return {
      testcases,
      totalDetected: testcases.length,
      detectedFormat: 'Cặp tệp tương ứng (ví dụ: 1.in / 1.out, test1.inp / test1.out)',
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file tải lên!' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const extractedFiles: ExtractedFile[] = [];

    // Kiểm tra định dạng ZIP hoặc RAR
    const isRar = fileName.endsWith('.rar');
    const isZip = fileName.endsWith('.zip');

    if (isRar) {
      // Giải nén file .RAR bằng node-unrar-js
      const extractor = await createExtractorFromData({ data: arrayBuffer });
      const extracted = extractor.extract();
      const utf8Decoder = new TextDecoder('utf-8');

      const filesIterator = extracted.files;
      let nextFile = filesIterator.next();
      while (!nextFile.done) {
        const item = nextFile.value;
        if (!item.fileHeader.flags.directory) {
          const filePath = item.fileHeader.name;
          if (!filePath.startsWith('__MACOSX') && !filePath.includes('.DS_Store')) {
            const parts = filePath.split(/[/\\]/);
            const name = parts[parts.length - 1];
            if (name && !name.startsWith('.')) {
              if (item.extraction) {
                const content = utf8Decoder.decode(item.extraction);
                extractedFiles.push({ path: filePath, name, content });
              }
            }
          }
        }
        nextFile = filesIterator.next();
      }
    } else {
      // Giải nén file .ZIP bằng JSZip
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(arrayBuffer);

      for (const relativePath of Object.keys(loadedZip.files)) {
        const zipObj = loadedZip.files[relativePath];
        if (zipObj.dir) continue;
        if (relativePath.startsWith('__MACOSX') || relativePath.includes('.DS_Store')) continue;

        const parts = relativePath.split(/[/\\]/);
        const name = parts[parts.length - 1];
        if (!name || name.startsWith('.')) continue;

        const content = await zipObj.async('string');
        extractedFiles.push({ path: relativePath, name, content });
      }
    }

    if (extractedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tệp nén không chứa dữ liệu hợp lệ!' },
        { status: 400 }
      );
    }

    const paired = pairTestcases(extractedFiles);
    if (!paired || paired.testcases.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Không tìm thấy cặp file Input/Output nào trong tệp nén! Hãy đảm bảo tên file có phần mở rộng .in/.out hoặc .inp/.out.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      testcases: paired.testcases,
      totalDetected: paired.totalDetected,
      detectedFormat: `${paired.detectedFormat} [${isRar ? 'RAR' : 'ZIP'}]`,
    });
  } catch (err: any) {
    console.error('Error extracting archive:', err);
    return NextResponse.json(
      { success: false, error: `Lỗi khi giải nén: ${err.message || 'File nén bị hỏng'}` },
      { status: 500 }
    );
  }
}
