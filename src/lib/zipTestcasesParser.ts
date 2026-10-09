import JSZip from 'jszip';
import { ParsedTestcase } from './problemParser';

export interface ParsedZipResult {
  success: boolean;
  testcases: ParsedTestcase[];
  totalDetected: number;
  detectedFormat?: string;
  error?: string;
}

/**
 * Tự nhiên sắp xếp chuỗi (ví dụ: test1, test2, ..., test10 thay vì test1, test10, test2)
 */
function naturalSortCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Phân tích và trích xuất danh sách testcases từ File ZIP trực tiếp trên trình duyệt
 */
export async function parseTestcasesFromZip(zipFile: File | Blob): Promise<ParsedZipResult> {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipFile);

    // Thu thập tất cả các file trong zip (bỏ qua thư mục và file hệ thống ẩn như __MACOSX)
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

    // 1. THỬ CẤU TRÚC THEMIS: Mỗi testcase nằm trong 1 folder riêng (ví dụ: Test01/, Test02/, Test1/...)
    const folderMap: Record<string, typeof fileEntries> = {};
    for (const entry of fileEntries) {
      const parts = entry.path.split(/[/\\]/);
      if (parts.length >= 2) {
        // Có folder cha
        const folderName = parts[parts.length - 2];
        if (!folderMap[folderName]) folderMap[folderName] = [];
        folderMap[folderName].push(entry);
      }
    }

    const validFolders = Object.keys(folderMap).filter((f) => {
      const files = folderMap[f];
      return files.length >= 2;
    });

    // Nếu có ít nhất 1 thư mục chứa cả input và output
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

        // Nếu chưa tìm thấy theo đuôi, thử đoán: file 1 là in, file 2 là out
        if (!inFile && files.length >= 2) inFile = files[0].zipObject;
        if (!outFile && files.length >= 2) outFile = files[1].zipObject;

        if (inFile && outFile) {
          const inputContent = (await inFile.async('string')).trim();
          const outputContent = (await outFile.async('string')).trim();

          const lowerFolder = folderName.toLowerCase();
          const isSampleExplicit = lowerFolder.includes('sample') || lowerFolder.includes('mau');
          const isSample = isSampleExplicit || i < 2; // 2 test đầu mặc định là sample

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
          detectedFormat: 'Themis (Mỗi test một thư mục riêng: Test01, Test02...)',
        };
      }
    }

    // 2. THỬ CẤU TRÚC PHẲNG (Flat Files): Cặp file cùng tên theo số (1.in / 1.out, test1.inp / test1.out, ...)
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
        detectedFormat: 'Cặp tệp tương ứng (ví dụ: 1.in / 1.out, test1.inp / test1.out)',
      };
    }

    return {
      success: false,
      testcases: [],
      totalDetected: 0,
      error:
        'Không thể nhận diện cặp file Input và Output trong file ZIP! Hãy đảm bảo tên file có đuôi .in/.out hoặc .inp/.out.',
    };
  } catch (err: any) {
    return {
      success: false,
      testcases: [],
      totalDetected: 0,
      error: `Lỗi khi giải nén file ZIP: ${err.message || 'File ZIP bị lỗi hoặc hỏng'}`,
    };
  }
}
