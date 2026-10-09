import { Verdict, SingleTestResult } from '@/types';

export interface Judge0SubmissionResponse {
  token: string;
  stdout?: string | null;
  time?: string | null;
  memory?: number | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: {
    id: number;
    description: string;
  };
}

export interface Judge0ResultResponse {
  stdout: string | null;
  time: string | null;
  memory: number | null;
  stderr: string | null;
  token: string;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

/**
 * Giải mã base64 an toàn
 */
function decodeBase64(str: string | null | undefined): string | null {
  if (!str) return null;
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

/**
 * Mã hóa chuỗi sang base64
 */
function encodeBase64(str: string | null | undefined): string {
  if (!str) return '';
  return Buffer.from(str, 'utf-8').toString('base64');
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
 * Xác định Endpoint và Headers hiệu lực:
 * Tự động hỗ trợ RapidAPI, Direct Self-hosted, và tự động fallback sang public CE nếu chưa nhập RapidAPI Key.
 */
export function resolveJudge0Config(): { apiUrl: string; headers: Record<string, string> } {
  let apiUrl = (process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com').replace(/\/$/, '');
  const apiKey = (process.env.JUDGE0_API_KEY || '').trim();

  const isRapidApi = apiUrl.includes('rapidapi.com');
  const hasValidKey = apiKey && apiKey !== 'your_rapidapi_key_here';

  // Nếu cấu hình RapidAPI nhưng chưa điền Key hợp lệ, chuyển sang public CE để web chạy được ngay!
  if (isRapidApi && !hasValidKey) {
    apiUrl = 'https://ce.judge0.com';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (hasValidKey) {
    if (isRapidApi) {
      headers['x-rapidapi-host'] = new URL(apiUrl).hostname;
      headers['x-rapidapi-key'] = apiKey;
    } else {
      headers['X-Auth-Token'] = apiKey;
    }
  }

  return { apiUrl, headers };
}

/**
 * Gửi submission lên Judge0 với Base64 Encoding
 */
export async function submitToJudge0(params: {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  cpuTimeLimit?: number;
  memoryLimit?: number;
}): Promise<string> {
  const { apiUrl, headers } = resolveJudge0Config();
  const endpoint = `${apiUrl}/submissions?base64_encoded=true&wait=false`;

  const payload: Record<string, any> = {
    source_code: encodeBase64(params.sourceCode),
    language_id: params.languageId,
    stdin: encodeBase64(params.stdin || ''),
  };

  if (params.cpuTimeLimit) {
    payload.cpu_time_limit = Math.max(1, Math.ceil(params.cpuTimeLimit));
  }
  if (params.memoryLimit) {
    payload.memory_limit = params.memoryLimit;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as Judge0SubmissionResponse;
  if (!data.token) {
    throw new Error('Judge0 không trả về submission token hợp lệ.');
  }

  return data.token;
}

/**
 * Polling kết quả submission từ Judge0 với Base64 Decoding
 */
export async function pollJudge0Result(token: string, maxAttempts = 15, intervalMs = 1000): Promise<Judge0ResultResponse> {
  const { apiUrl, headers } = resolveJudge0Config();
  const endpoint = `${apiUrl}/submissions/${token}?base64_encoded=true`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Lỗi khi polling kết quả từ Judge0 (${response.status}): ${err}`);
    }

    const raw = (await response.json()) as Judge0ResultResponse;
    const statusId = raw.status?.id;

    // status.id > 2 nghĩa là đã xử lý xong (1: In Queue, 2: Processing)
    if (statusId && statusId > 2) {
      return {
        ...raw,
        stdout: decodeBase64(raw.stdout),
        stderr: decodeBase64(raw.stderr),
        compile_output: decodeBase64(raw.compile_output),
        message: decodeBase64(raw.message),
      };
    }

    // Chờ trước lượt poll tiếp theo
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Chấm bài quá thời gian chờ (Polling Timeout từ Judge0 API).');
}

/**
 * Map Judge0 status sang Verdict CP chuẩn
 */
export function mapJudge0StatusToVerdict(result: Judge0ResultResponse, expectedOutput?: string): Verdict {
  const statusId = result.status?.id;

  switch (statusId) {
    case 3: // Accepted
      if (expectedOutput !== undefined) {
        return compareOutput(result.stdout, expectedOutput) ? 'AC' : 'WA';
      }
      return 'AC';
    case 4: // Wrong Answer
      return 'WA';
    case 5: // Time Limit Exceeded
      return 'TLE';
    case 6: // Compilation Error
      return 'CE';
    case 7: // Runtime Error (SIGSEGV)
    case 8: // Runtime Error (SIGXFSZ)
    case 9: // Runtime Error (SIGFPE)
    case 10: // Runtime Error (SIGABRT)
    case 11: // Runtime Error (NZEC)
    case 12: // Runtime Error (Other)
      return 'RTE';
    case 13: // Internal Error
    case 14: // Exec Format Error
      return 'RTE';
    default:
      if (expectedOutput !== undefined) {
        return compareOutput(result.stdout, expectedOutput) ? 'AC' : 'WA';
      }
      return 'AC';
  }
}

/**
 * Thực thi một testcase hoàn chỉnh và so khớp kết quả
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
  const { apiUrl, headers } = resolveJudge0Config();
  const timeLimitSeconds = Math.max(1, Math.ceil(params.timeLimitMs / 1000));

  try {
    const payload: Record<string, any> = {
      source_code: encodeBase64(params.sourceCode),
      language_id: params.languageId,
      stdin: encodeBase64(params.input || ''),
      cpu_time_limit: timeLimitSeconds,
      memory_limit: params.memoryLimitKb,
    };

    let finalJudgeResult: Judge0ResultResponse | null = null;
    const endpointWait = `${apiUrl}/submissions?base64_encoded=true&wait=true`;

    try {
      const response = await fetch(endpointWait, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (response.ok) {
        const raw = (await response.json()) as Judge0SubmissionResponse;
        if (raw.status && raw.status.id > 2) {
          finalJudgeResult = {
            token: raw.token,
            status: raw.status,
            time: raw.time ?? null,
            memory: raw.memory ?? null,
            stdout: decodeBase64(raw.stdout),
            stderr: decodeBase64(raw.stderr),
            compile_output: decodeBase64(raw.compile_output),
            message: decodeBase64(raw.message),
          };
        } else if (raw.token) {
          finalJudgeResult = await pollJudge0Result(raw.token);
        }
      }
    } catch {
      // Fallback sang async submit nếu wait không khả dụng
    }

    if (!finalJudgeResult) {
      const token = await submitToJudge0({
        sourceCode: params.sourceCode,
        languageId: params.languageId,
        stdin: params.input,
        cpuTimeLimit: timeLimitSeconds,
        memoryLimit: params.memoryLimitKb,
      });

      finalJudgeResult = await pollJudge0Result(token);
    }

    const isSuccess = finalJudgeResult.status.id === 3;
    let verdict: Verdict;

    if (finalJudgeResult.status.id === 6) {
      verdict = 'CE';
    } else if (finalJudgeResult.status.id === 5) {
      verdict = 'TLE';
    } else if (finalJudgeResult.status.id >= 7 && finalJudgeResult.status.id <= 14) {
      verdict = 'RTE';
    } else if (isSuccess) {
      verdict = compareOutput(finalJudgeResult.stdout, params.expectedOutput) ? 'AC' : 'WA';
    } else {
      verdict = 'WA';
    }

    const timeTaken = finalJudgeResult.time ? parseFloat(finalJudgeResult.time) : 0;
    const memoryUsed = finalJudgeResult.memory || 0;

    return {
      testIndex: params.testIndex,
      isSample: params.isSample,
      verdict,
      time: timeTaken,
      memory: memoryUsed,
      stdout: finalJudgeResult.stdout || '',
      expectedOutput: params.expectedOutput,
      error: finalJudgeResult.compile_output || finalJudgeResult.stderr || finalJudgeResult.message || undefined,
      input: params.isSample ? params.input : undefined,
    };
  } catch (error: any) {
    return {
      testIndex: params.testIndex,
      isSample: params.isSample,
      verdict: 'RTE',
      time: 0,
      memory: 0,
      error: error.message || 'Lỗi khi chấm testcase',
      input: params.isSample ? params.input : undefined,
    };
  }
}
