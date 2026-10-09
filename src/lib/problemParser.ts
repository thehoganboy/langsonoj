export interface ParsedTestcase {
  input: string;
  output: string;
  isSample: boolean;
  explanation?: string;
}

export interface ParsedProblemData {
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  tags: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  testcases: ParsedTestcase[];
}

/**
 * Tự động tạo slug an toàn từ tiêu đề tiếng Việt / tiếng Anh
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Phân tích cú pháp file .txt mẫu thành cấu trúc dữ liệu bài tập
 */
export function parseProblemTxt(content: string): {
  success: boolean;
  data?: ParsedProblemData;
  error?: string;
} {
  try {
    if (!content || !content.trim()) {
      return { success: false, error: 'File văn bản trống!' };
    }

    // 1. Chuẩn hóa xuống dòng và gỡ bỏ triệt để các ký tự escape markdown (ví dụ: \$ -> $, \--- -> ---, \[ -> [, \] -> ])
    let text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text
      .replaceAll('\\$', '$')
      .replaceAll('\\*', '*')
      .replaceAll('\\-', '-')
      .replaceAll('\\[', '[')
      .replaceAll('\\]', ']')
      .replaceAll('\\=', '=')
      .replaceAll('\\_', '_')
      .replaceAll('\\`', '`')
      .replaceAll('\\#', '#')
      .replaceAll('\\\\le', '\\le')
      .replaceAll('\\\\ge', '\\ge')
      .replaceAll('\\\\ne', '\\ne');

    // 2. Tách các section chính: === TÊN_SECTION ===
    const KNOWN_SECTIONS = [
      'TITLE', 'SLUG', 'DIFFICULTY', 'TIME_LIMIT', 'MEMORY_LIMIT',
      'TAGS', 'DESCRIPTION', 'INPUT_FORMAT', 'OUTPUT_FORMAT', 'CONSTRAINTS', 'TESTCASES'
    ];

    const sectionHeaderRegex = /(?:^|\n)\s*(?:={3,}|---)\s*([A-Za-z0-9_]+)\s*(?:={3,}|---)/gi;
    const sectionPositions: { key: string; index: number; headerLength: number }[] = [];
    let sMatch: RegExpExecArray | null;

    while ((sMatch = sectionHeaderRegex.exec(text)) !== null) {
      const key = sMatch[1].trim().toUpperCase();
      if (KNOWN_SECTIONS.includes(key)) {
        sectionPositions.push({
          key,
          index: sMatch.index,
          headerLength: sMatch[0].length,
        });
      }
    }

    const sections: Record<string, string> = {};
    for (let i = 0; i < sectionPositions.length; i++) {
      const current = sectionPositions[i];
      const nextIndex = i + 1 < sectionPositions.length ? sectionPositions[i + 1].index : text.length;
      const body = text.substring(current.index + current.headerLength, nextIndex).trim();
      sections[current.key] = body;
    }

    const title = sections['TITLE'] || '';
    if (!title) {
      return { success: false, error: 'Thiếu trường === TITLE === (Tên bài tập) trong file!' };
    }

    const rawSlug = sections['SLUG'] || '';
    const slug = rawSlug ? slugify(rawSlug) : slugify(title);

    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
    const diffUpper = (sections['DIFFICULTY'] || '').toUpperCase();
    if (diffUpper === 'MEDIUM' || diffUpper === 'TRUNG BÌNH') difficulty = 'MEDIUM';
    else if (diffUpper === 'HARD' || diffUpper === 'KHÓ') difficulty = 'HARD';

    const timeLimit = parseInt(sections['TIME_LIMIT'] || '1000', 10) || 1000;
    const memoryLimit = parseInt(sections['MEMORY_LIMIT'] || '262144', 10) || 262144;
    const tags = sections['TAGS'] || '';
    const description = sections['DESCRIPTION'] || '';
    const inputFormat = sections['INPUT_FORMAT'] || '';
    const outputFormat = sections['OUTPUT_FORMAT'] || '';
    const constraints = sections['CONSTRAINTS'] || '';

    // 3. Tách bộ testcases trong khối === TESTCASES ===
    const testcases: ParsedTestcase[] = [];
    const testcasesBlock = sections['TESTCASES'] || '';

    if (testcasesBlock) {
      // Hỗ trợ linh hoạt: --- TEST 1 [SAMPLE] ---, === TEST 2 [HIDDEN] ===, [TEST 1], v.v.
      const testHeaderRegex = /(?:^|\n)\s*(?:---|={3,}|\[)\s*TEST(?:CASE)?\s*(\d*)\s*(?:[:\-–—]?\s*)?(?:\[(SAMPLE|HIDDEN|MẪU|ẨN|VÍ DỤ)\]|\((SAMPLE|HIDDEN|MẪU|ẨN|VÍ DỤ)\)|(SAMPLE|HIDDEN|MẪU|ẨN|VÍ DỤ))?\s*(?:---|={3,}|\])?/gi;

      const testIndices: {
        testNum: string;
        index: number;
        headerLength: number;
        isSampleExplicit: boolean;
        isHiddenExplicit: boolean;
      }[] = [];

      let tMatch: RegExpExecArray | null;
      while ((tMatch = testHeaderRegex.exec(testcasesBlock)) !== null) {
        const typeRaw = (tMatch[2] || tMatch[3] || tMatch[4] || '').toUpperCase();
        const isHidden = typeRaw.includes('HIDDEN') || typeRaw.includes('ẨN');
        const isSample = typeRaw.includes('SAMPLE') || typeRaw.includes('MẪU') || typeRaw.includes('VÍ DỤ');
        testIndices.push({
          testNum: tMatch[1] || `${testIndices.length + 1}`,
          index: tMatch.index,
          headerLength: tMatch[0].length,
          isSampleExplicit: isSample,
          isHiddenExplicit: isHidden,
        });
      }

      for (let i = 0; i < testIndices.length; i++) {
        const current = testIndices[i];
        const nextIndex = i + 1 < testIndices.length ? testIndices[i + 1].index : testcasesBlock.length;
        const testBody = testcasesBlock.substring(current.index + current.headerLength, nextIndex).trim();

        // Quyết định isSample
        let isSample = true;
        if (current.isHiddenExplicit) {
          isSample = false;
        } else if (current.isSampleExplicit) {
          isSample = true;
        } else {
          isSample = i < 2; // Mặc định 2 test đầu là sample nếu không ghi rõ
        }

        // Tìm INPUT, OUTPUT, EXPLANATION (KHÔNG DÙNG cờ /m để không bắt nhầm $ xuống dòng của input nhiều dòng)
        const inputMatch = testBody.match(/(?:\[INPUT\]|---INPUT---|=== INPUT ===|\bINPUT\b:?)\s*([\s\S]*?)(?=(?:\[OUTPUT\]|---OUTPUT---|=== OUTPUT ===|\bOUTPUT\b:?|\[EXPLANATION\]|---EXPLANATION---|=== EXPLANATION ===|\bEXPLANATION\b:?|GIẢI THÍCH:|$))/i);
        const outputMatch = testBody.match(/(?:\[OUTPUT\]|---OUTPUT---|=== OUTPUT ===|\bOUTPUT\b:?)\s*([\s\S]*?)(?=(?:\[INPUT\]|---INPUT---|=== INPUT ===|\bINPUT\b:?|\[EXPLANATION\]|---EXPLANATION---|=== EXPLANATION ===|\bEXPLANATION\b:?|GIẢI THÍCH:|$))/i);
        const explMatch = testBody.match(/(?:\[EXPLANATION\]|---EXPLANATION---|=== EXPLANATION ===|\bEXPLANATION\b:?|GIẢI THÍCH:)\s*([\s\S]*?)(?=(?:\[INPUT\]|---INPUT---|=== INPUT ===|\bINPUT\b:?|\[OUTPUT\]|---OUTPUT---|=== OUTPUT ===|\bOUTPUT\b:?|$))/i);

        let input = inputMatch ? inputMatch[1].trim() : '';
        let output = outputMatch ? outputMatch[1].trim() : '';
        let explanation = explMatch ? explMatch[1].trim() : undefined;

        if (input !== '' || output !== '') {
          testcases.push({
            input,
            output,
            isSample,
            explanation,
          });
        }
      }
    }

    // Nếu không tìm thấy testcase nào theo định dạng chuẩn, tạo ít nhất 1 test rỗng
    if (testcases.length === 0) {
      testcases.push({
        input: '',
        output: '',
        isSample: true,
        explanation: '',
      });
    }

    return {
      success: true,
      data: {
        title,
        slug,
        difficulty,
        timeLimit,
        memoryLimit,
        tags,
        description: description || title,
        inputFormat,
        outputFormat,
        constraints,
        testcases,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi khi phân tích file mẫu: ${err.message || 'Cú pháp không hợp lệ'}`,
    };
  }
}

/**
 * Nội dung file mẫu sample.txt chuẩn
 */
export const SAMPLE_TXT_CONTENT = `=== TITLE ===
Tính Tổng Hai Số (A + B Problem)

=== SLUG ===
aplusb-example

=== DIFFICULTY ===
EASY

=== TIME_LIMIT ===
1000

=== MEMORY_LIMIT ===
262144

=== TAGS ===
Math, Basic, Input-Output

=== DESCRIPTION ===
Cho hai số nguyên $a$ và $b$. Hãy tính và in ra giá trị tổng $a + b$.

Đây là bài toán kinh điển giúp làm quen với hệ thống thi đấu lập trình **LANG SON OJ**.
Bạn có thể sử dụng các ngôn ngữ C++ (GCC), Python 3, hoặc Java để giải.

=== INPUT_FORMAT ===
Một dòng duy nhất chứa hai số nguyên $a$ và $b$ cách nhau bởi một khoảng trắng.

=== OUTPUT_FORMAT ===
In ra một số nguyên duy nhất là kết quả của phép cộng $a + b$.

=== CONSTRAINTS ===
$-10^9 \\le a, b \\le 10^9$

=== TESTCASES ===
--- TEST 1 [SAMPLE] ---
[INPUT]
3 5
[OUTPUT]
8
[EXPLANATION]
Tổng của 3 và 5 là 8.

--- TEST 2 [SAMPLE] ---
[INPUT]
100 -20
[OUTPUT]
80
[EXPLANATION]
100 + (-20) = 80.

--- TEST 3 [HIDDEN] ---
[INPUT]
0 0
[OUTPUT]
0

--- TEST 4 [HIDDEN] ---
[INPUT]
-500000000 -500000000
[OUTPUT]
-1000000000

--- TEST 5 [HIDDEN] ---
[INPUT]
1000000000 1000000000
[OUTPUT]
2000000000
`;

/**
 * Nội dung file guild.txt (hướng dẫn)
 */
export const GUILD_TXT_CONTENT = `================================================================================
           HƯỚNG DẪN ĐIỀN FILE MẪU TẠO BÀI TẬP - LANG SON OJ
================================================================================

File mẫu sử dụng cú pháp các khối thẻ phân cách: === TÊN_KHỐI ===
Dưới đây là chi tiết từng phần bạn cần điền:

1. THÔNG TIN BÀI TẬP:
   - === TITLE ===
     Tên hiển thị của bài toán.
     Ví dụ: Số Fibonacci Thứ N

   - === SLUG ===
     Mã định danh duy nhất của bài trên URL (chữ thường, số, gạch ngang).
     Ví dụ: fibonacci-number
     (Nếu để trống, hệ thống sẽ tự động tạo slug từ Tên bài).

   - === DIFFICULTY ===
     Độ khó của bài: chọn EASY (Dễ), MEDIUM (Trung bình), hoặc HARD (Khó).
     Mặc định nếu để trống là EASY.

   - === TIME_LIMIT ===
     Thời gian chạy tối đa cho mỗi testcase (ms).
     Ví dụ: 1000 (tức là 1 giây). Mặc định: 1000.

   - === MEMORY_LIMIT ===
     Giới hạn bộ nhớ RAM tối đa (KB).
     Ví dụ: 262144 (tương ứng 256 MB). Mặc định: 262144.

   - === TAGS ===
     Chủ đề bài tập, phân cách bằng dấu phẩy.
     Ví dụ: Math, Dynamic Programming, Array

2. ĐỀ BÀI & QUY CÁCH I/O (Hỗ trợ định dạng Markdown và KaTeX Toán học):
   - === DESCRIPTION ===
     Mô tả đề bài chi tiết.
     + Hỗ trợ gõ công thức toán học KaTeX trong cặp dấu $: $a + b$ hoặc $O(N)$
     + Công thức hiển thị khối ở dòng riêng: $$F_n = F_{n-1} + F_{n-2}$$

   - === INPUT_FORMAT ===
     Quy cách dữ liệu đầu vào standard input (stdin).

   - === OUTPUT_FORMAT ===
     Quy cách dữ liệu đầu ra standard output (stdout).

   - === CONSTRAINTS ===
     Các ràng buộc dữ liệu: $1 \\le N \\le 10^5$, $|A_i| \\le 10^9$

3. BỘ TESTCASES (=== TESTCASES ===):
   Mỗi testcase bắt đầu bằng dòng tiêu đề:
   --- TEST <Số thứ tự> [<LOẠI_TEST>] ---
   Trong đó <LOẠI_TEST> gồm 2 loại:
   + [SAMPLE] : Testcase ví dụ công khai trong đề bài.
   + [HIDDEN] : Testcase bí mật dùng để chấm điểm (sẽ mở khóa cho thí sinh xem sau khi nộp).

   Bên trong mỗi testcase có các thẻ:
   + [INPUT]       : Dữ liệu vào của testcase.
   + [OUTPUT]      : Đáp án mong đợi chuẩn xác (Expected Output).
   + [EXPLANATION] : Giải thích testcase (thường áp dụng cho test SAMPLE, có thể bỏ trống).

   Ví dụ 2 testcase:
   --- TEST 1 [SAMPLE] ---
   [INPUT]
   3 5
   [OUTPUT]
   8
   [EXPLANATION]
   3 + 5 = 8

   --- TEST 2 [HIDDEN] ---
   [INPUT]
   1000000000 1000000000
   [OUTPUT]
   2000000000

================================================================================
MẸO SỬ DỤNG:
1. Mở file 'sample.txt', thay đổi nội dung đề bài và các bộ test của bạn.
2. Lưu file lại (đuôi .txt).
3. Vào trang Quản trị (Admin) -> "Thêm bài tập" -> Chọn tab "Nhập từ file mẫu".
4. Kéo thả hoặc chọn file vừa lưu, hệ thống sẽ tự động điền toàn bộ vào form!
================================================================================
`;
