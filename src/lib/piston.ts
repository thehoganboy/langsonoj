import { Verdict, SingleTestResult, LanguageConfig } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export interface PistonExecuteResponse {
  language?: string;
  version?: string;
  run?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string | null;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string | null;
  };
  message?: string;
}

/**
 * Chuẩn hóa output theo tiêu chuẩn Competitive Programming:
 * - Chuẩn hóa line endings (\r\n -> \n)
 * - Trim khoảng trắng cuối mỗi dòng
 * - Bỏ các dòng trống ở cuối văn bản
 */
export function normalizeOutput(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

/**
 * So sánh stdout của người dùng với expected output của testcase
 */
export function compareOutput(actual: string | null | undefined, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Thực thi code trực tiếp qua Piston API: https://emkc.org/api/v2/piston/execute
 * Không cần API key, gửi source_code và stdin trực tiếp.
 */
export async function executeWithPiston(params: {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  timeLimitMs?: number;
}): Promise<{
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  code: number;
  signal: string | null;
  isCompileError: boolean;
  timeTaken: number;
}> {
  const pistonApiUrl =
    process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';

  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === Number(params.languageId)) || {
    id: params.languageId,
    name: 'C++',
    monacoLang: 'cpp',
    fileExtension: 'cpp',
    pistonLang: 'cpp',
    pistonFile: 'solution.cpp',
    defaultCode: '',
  };

  const payload = {
    language: langConfig.pistonLang,
    version: '*',
    files: [
      {
        name: langConfig.pistonFile,
        content: params.sourceCode,
      },
    ],
    stdin: params.stdin || '',
    run_timeout: Math.max(2000, params.timeLimitMs || 3000),
    compile_timeout: 10000,
  };

  const startTime = Date.now();

  try {
    const response = await fetch(pistonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const data = (await response.json()) as PistonExecuteResponse;

    // Kiểm tra nếu emkc.org yêu cầu whitelist (chính sách mới 2026)
    if (data.message && data.message.includes('whitelist only')) {
      // Tự động chuyển tiếp sang máy chủ CE dự phòng để không làm gián đoạn trải nghiệm người dùng
      return await executeFallbackJudge({
        sourceCode: params.sourceCode,
        languageId: params.languageId,
        stdin: params.stdin || '',
        timeLimitMs: params.timeLimitMs || 1000,
      });
    }

    if (!response.ok) {
      throw new Error(data.message || `Lỗi Piston API (HTTP ${response.status})`);
    }

    const compile = data.compile;
    const run = data.run;

    // Kiểm tra lỗi biên dịch (Compile Error)
    const isCompileError = Boolean(compile && compile.code !== 0);
    const compileOutput = isCompileError
      ? compile?.output || compile?.stderr || 'Lỗi biên dịch'
      : null;

    const stdout = run?.stdout || '';
    const stderr = run?.stderr || '';
    const exitCode = run?.code ?? (isCompileError ? 1 : 0);
    const signal = run?.signal || null;

    return {
      stdout,
      stderr,
      compileOutput,
      code: exitCode,
      signal,
      isCompileError,
      timeTaken: elapsedSeconds,
    };
  } catch (error: any) {
    // Nếu kết nối tới emkc.org gặp lỗi, thử máy chủ sandbox dự phòng
    try {
      return await executeFallbackJudge({
        sourceCode: params.sourceCode,
        languageId: params.languageId,
        stdin: params.stdin || '',
        timeLimitMs: params.timeLimitMs || 1000,
      });
    } catch {
      throw new Error(`Piston Engine Error: ${error.message || 'Không thể thực thi code'}`);
    }
  }
}

/**
 * Máy chủ dự phòng mở trong trường hợp emkc.org bảo trì hoặc yêu cầu whitelist token
 */
async function executeFallbackJudge(params: {
  sourceCode: string;
  languageId: number;
  stdin: string;
  timeLimitMs: number;
}): Promise<{
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  code: number;
  signal: string | null;
  isCompileError: boolean;
  timeTaken: number;
}> {
  const fallbackUrl = 'https://ce.judge0.com/submissions?base64_encoded=true&wait=true';
  const timeLimitSeconds = Math.max(1, Math.ceil(params.timeLimitMs / 1000));

  const payload = {
    source_code: Buffer.from(params.sourceCode).toString('base64'),
    language_id: params.languageId,
    stdin: Buffer.from(params.stdin).toString('base64'),
    cpu_time_limit: timeLimitSeconds,
  };

  const response = await fetch(fallbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Fallback Sandbox Error (HTTP ${response.status})`);
  }

  const data = await response.json();
  const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf-8') : '';
  const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf-8') : '';
  const compileOutput = data.compile_output
    ? Buffer.from(data.compile_output, 'base64').toString('utf-8')
    : null;

  const isCompileError = data.status?.id === 6;
  const timeTaken = data.time ? parseFloat(data.time) : 0.05;

  let signal: string | null = null;
  if (data.status?.id === 5) signal = 'SIGKILL';

  return {
    stdout,
    stderr,
    compileOutput,
    code: isCompileError ? 1 : 0,
    signal,
    isCompileError,
    timeTaken,
  };
}

/**
 * Thực thi một testcase hoàn chỉnh và xác định Verdict chuẩn CP
 */
export async function executeSingleTest(params: {
  sourceCode: string;
  languageId: number;
  testIndex: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  timeLimitMs: number;
  memoryLimitKb: number;
}): Promise<SingleTestResult> {
  try {
    const result = await executeWithPiston({
      sourceCode: params.sourceCode,
      languageId: params.languageId,
      stdin: params.input,
      timeLimitMs: params.timeLimitMs,
    });

    let verdict: Verdict;

    if (result.isCompileError) {
      verdict = 'CE';
    } else if (result.signal === 'SIGKILL' || result.signal === 'SIGXCPU') {
      verdict = 'TLE';
    } else if (result.code !== 0) {
      verdict = 'RTE';
    } else {
      verdict = compareOutput(result.stdout, params.expectedOutput) ? 'AC' : 'WA';
    }

    return {
      testIndex: params.testIndex,
      isSample: params.isSample,
      verdict,
      time: result.timeTaken,
      memory: Math.round(params.memoryLimitKb / 8), // Ước tính bộ nhớ
      stdout: result.stdout,
      expectedOutput: params.expectedOutput,
      error: result.compileOutput || result.stderr || undefined,
      input: params.input,
    };
  } catch (error: any) {
    return {
      testIndex: params.testIndex,
      isSample: params.isSample,
      verdict: 'RTE',
      time: 0,
      memory: 0,
      error: error.message || 'Lỗi khi thực thi testcase qua Piston Engine',
      input: params.input,
    };
  }
}
