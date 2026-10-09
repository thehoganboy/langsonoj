import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeSingleTest, executeWithPiston, compareOutput } from '@/lib/piston';
import { Verdict } from '@/types';

export async function POST(req: Request) {
  try {
    const { problemId, languageId, sourceCode, customInput } = await req.json();

    if (!problemId || !languageId || !sourceCode) {
      return NextResponse.json({ error: 'Thiếu thông tin bài tập, ngôn ngữ hoặc mã nguồn!' }, { status: 400 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testcases: {
          where: { isSample: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Bài tập không tồn tại!' }, { status: 404 });
    }

    // Trường hợp 1: Chạy với Custom Input trực tiếp qua Piston API
    if (typeof customInput === 'string' && customInput.length > 0) {
      try {
        const result = await executeWithPiston({
          sourceCode,
          languageId: Number(languageId),
          stdin: customInput,
          timeLimitMs: problem.timeLimit,
        });

        let verdict: Verdict = 'AC';
        if (result.isCompileError) {
          verdict = 'CE';
        } else if (result.signal === 'SIGKILL' || result.signal === 'SIGXCPU') {
          verdict = 'TLE';
        } else if (result.code !== 0) {
          verdict = 'RTE';
        }

        return NextResponse.json({
          mode: 'custom',
          verdict,
          stdout: result.stdout,
          time: result.timeTaken,
          memory: Math.round(problem.memoryLimit / 8),
          error: result.compileOutput || result.stderr || null,
          input: customInput,
        });
      } catch (err: any) {
        return NextResponse.json({
          mode: 'custom',
          verdict: 'RTE',
          stdout: '',
          time: 0,
          memory: 0,
          error: err.message || 'Lỗi khi chạy custom input qua Piston API',
          input: customInput,
        });
      }
    }

    // Trường hợp 2: Chạy với Sample Testcases
    if (problem.testcases.length === 0) {
      return NextResponse.json({ error: 'Bài tập này chưa có Sample Test nào!' }, { status: 400 });
    }

    const sampleResults = [];
    for (let i = 0; i < problem.testcases.length; i++) {
      const tc = problem.testcases[i];
      const res = await executeSingleTest({
        sourceCode,
        languageId: Number(languageId),
        testIndex: i + 1,
        input: tc.input,
        expectedOutput: tc.output,
        isSample: true,
        timeLimitMs: problem.timeLimit,
        memoryLimitKb: problem.memoryLimit,
      });

      sampleResults.push({
        ...res,
        explanation: tc.explanation,
      });

      // Nếu lỗi biên dịch (CE), dừng ngay không cần test tiếp
      if (res.verdict === 'CE') {
        break;
      }
    }

    const allPassed = sampleResults.every((r) => r.verdict === 'AC');
    const firstFailing = sampleResults.find((r) => r.verdict !== 'AC');

    return NextResponse.json({
      mode: 'sample',
      overallVerdict: allPassed ? 'AC' : (firstFailing?.verdict || 'WA'),
      results: sampleResults,
    });
  } catch (error: any) {
    console.error('Lỗi khi chạy Run Sample:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý Run' }, { status: 500 });
  }
}
