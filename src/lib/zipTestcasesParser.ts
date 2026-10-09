import JSZip from 'jszip';
import { ParsedTestcase } from './problemParser';

export interface ParsedZipResult {
  success: boolean;
  testcases: ParsedTestcase[];
  totalDetected: number;
  detectedFormat?: string;
  error?: string;
}

function naturalSortCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Phân tích và trích xuất danh sách testcases từ File ZIP hoặc RAR
 * - Hỗ trợ cả file .zip và .rar
 * - Nhận diện cấu trúc Themis (Test01/, Test02/...) và cấu trúc phẳng (1.in / 1.out...)
 */
export async function parseTestcasesFromArchive(archiveFile: File | Blob): Promise<ParsedZipResult> {
  const fileName = (archiveFile instanceof File ? archiveFile.name : '').toLowerCase();
  const isRar = fileName.endsWith('.rar');

  // Nếu là file RAR: Gửi qua API giải nén chuyên dụng phía server (sử dụng WebAssembly node-unrar-js)
  if (isRar) {
    try {
      const formData = new FormData();
      formData.append('file', archiveFile);

      const res = await fetch('/api/admin/extract-archive', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          testcases: [],
          totalDetected: 0,
          error: data.error || 'Lỗi khi giải nén tệp RAR!',
        };
      }

      return {
        success: true,
        testcases: data.testcases,
        totalDetected: data.totalDetected,
        detectedFormat: data.detectedFormat,
      };
    } catch (err: any) {
      return {
        success: false,
        testcases: [],
        totalDetected: 0,
        error: `Không thể kết nối đến máy chủ giải nén RAR: ${err.message}`,
      };
    }
  }

  // Nếu là file ZIP: Giải nén siêu tốc trực tiếp trên trình duyệt bằng JSZip
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(archiveFile);

    const fileEntries: { path: string; name: string; zipObject: JSZip.JSZipObject }[] = [];

    loadedZip.forEach((relativePath, zipObject) => {
      if (zipObject.dir) return;
      if (relativePath.startsWith('__MACOSX') || relativePath.includes('/.DS_Store')) return;
      if (relativePath.endsWith('.DS_Store')) return;

      const parts = relativePath.split(/[/\\]/);
      const fileName = parts[parts.length - 1];
      if (!fileName || fileName.startsWith('.')) return;

      fileEntries.push({
        path: relativePath,
        name: fileName,
        zipObject,
      });
    });

    if (fileEntries.length === 0) {
      return {
        success: false,
        testcases: [],
        totalDetected: 0,
        error: 'File ZIP không chứa bất kỳ tệp dữ liệu test nào!',
      };
    }

    // 1. Cấu trúc Themis (Mỗi test nằm trong folder riêng: Test01, Test02...)
    const folderMap: Record<string, typeof fileEntries> = {};
    for (const entry of fileEntries) {
      const parts = entry.path.split(/[/\\]/);
      if (parts.length >= 2) {
        const folderName = parts[parts.length - 2];
        if (!folderMap[folderName]) folderMap[folderName] = [];
        folderMap[folderName].push(entry);
      }
    }

    const validFolders = Object.keys(folderMap).filter((f) => folderMap[f].length >= 2);

    if (validFolders.length > 0) {
      validFolders.sort(naturalSortCompare);
      const testcases: ParsedTestcase[] = [];

      for (let i = 0; i < validFolders.length; i++) {
        const folderName = validFolders[i];
        const files = folderMap[folderName];

        let inFile: JSZip.JSZipObject | null = null;
        let outFile: JSZip.JSZipObject | null = null;

        for (const file of files) {
          const lowerName = file.name.toLowerCase();
          if (
            lowerName.endsWith('.inp') ||
            lowerName.endsWith('.in') ||
            lowerName.includes('input') ||
            lowerName.includes('.in.')
          ) {
            inFile = file.zipObject;
          } else if (
            lowerName.endsWith('.out') ||
            lowerName.endsWith('.ans') ||
            lowerName.includes('output') ||
            lowerName.includes('.out.')
          ) {
            outFile = file.zipObject;
          }
        }

        if (!inFile && files.length >= 2) inFile = files[0].zipObject;
        if (!outFile && files.length >= 2) outFile = files[1].zipObject;

        if (inFile && outFile) {
          const inputContent = (await inFile.async('string')).trim();
          const outputContent = (await outFile.async('string')).trim();

          const lowerFolder = folderName.toLowerCase();
          const isSampleExplicit = lowerFolder.includes('sample') || lowerFolder.includes('mau');
          const isSample = isSampleExplicit || i < 2;

          testcases.push({
            input: inputContent,
            output: outputContent,
            isSample,
            explanation: isSample ? `Test ví dụ trích từ ${folderName}` : undefined,
          });
        }
      }

      if (testcases.length > 0) {
        return {
          success: true,
          testcases,
          totalDetected: testcases.length,
          detectedFormat: 'Themis (Mỗi test một thư mục riêng: Test01, Test02...) [ZIP]',
        };
      }
    }

    // 2. Cấu trúc phẳng: Cặp tệp cùng tên theo số (1.in / 1.out, test1.inp / test1.out, ...)
    const pairsMap: Record<
      string,
      { in?: JSZip.JSZipObject; out?: JSZip.JSZipObject }
    > = {};

    for (const entry of fileEntries) {
      const lowerName = entry.name.toLowerCase();
      let isInput = false;
      let isOutput = false;
      let baseKey = '';

      if (lowerName.endsWith('.inp') || lowerName.endsWith('.in')) {
        isInput = true;
        baseKey = entry.name.replace(/\.(inp|in)$/i, '');
      } else if (lowerName.endsWith('.out') || lowerName.endsWith('.ans')) {
        isOutput = true;
        baseKey = entry.name.replace(/\.(out|ans)$/i, '');
      } else if (lowerName.includes('input')) {
        isInput = true;
        baseKey = lowerName.replace('input', '').replace(/\.[^.]+$/, '');
      } else if (lowerName.includes('output') || lowerName.includes('ans')) {
        isOutput = true;
        baseKey = lowerName.replace(/(output|ans)/, '').replace(/\.[^.]+$/, '');
      }

      if (baseKey) {
        baseKey = baseKey.trim();
        if (!pairsMap[baseKey]) pairsMap[baseKey] = {};
        if (isInput) pairsMap[baseKey].in = entry.zipObject;
        if (isOutput) pairsMap[baseKey].out = entry.zipObject;
      }
    }

    const validKeys = Object.keys(pairsMap).filter(
      (k) => pairsMap[k].in && pairsMap[k].out
    );

    if (validKeys.length > 0) {
      validKeys.sort(naturalSortCompare);
      const testcases: ParsedTestcase[] = [];

      for (let i = 0; i < validKeys.length; i++) {
        const key = validKeys[i];
        const pair = pairsMap[key];
        const inputContent = (await pair.in!.async('string')).trim();
        const outputContent = (await pair.out!.async('string')).trim();

        const lowerKey = key.toLowerCase();
        const isSampleExplicit = lowerKey.includes('sample') || lowerKey.includes('mau');
        const isSample = isSampleExplicit || i < 2;

        testcases.push({
          input: inputContent,
          output: outputContent,
          isSample,
          explanation: isSample ? `Test mẫu (${key})` : undefined,
        });
      }

      return {
        success: true,
        testcases,
        totalDetected: testcases.length,
        detectedFormat: 'Cặp tệp tương ứng (ví dụ: 1.in / 1.out, test1.inp / test1.out) [ZIP]',
      };
    }

    // Nếu JSZip client không nhận diện được, thử gọi API server fallback
    const formData = new FormData();
    formData.append('file', archiveFile);
    const fallbackRes = await fetch('/api/admin/extract-archive', {
      method: 'POST',
      body: formData,
    });
    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.success) {
      return {
        success: true,
        testcases: fallbackData.testcases,
        totalDetected: fallbackData.totalDetected,
        detectedFormat: fallbackData.detectedFormat,
      };
    }

    return {
      success: false,
      testcases: [],
      totalDetected: 0,
      error:
        'Không thể nhận diện cặp file Input và Output trong file ZIP/RAR! Hãy đảm bảo tên file có đuôi .in/.out hoặc .inp/.out.',
    };
  } catch (err: any) {
    return {
      success: false,
      testcases: [],
      totalDetected: 0,
      error: `Lỗi khi giải nén: ${err.message || 'File nén bị lỗi'}`,
    };
  }
}

// Giữ lại alias để tương thích ngược
export const parseTestcasesFromZip = parseTestcasesFromArchive;
