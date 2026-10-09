import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        problem: {
          select: {
            id: true,
            slug: true,
            title: true,
            timeLimit: true,
            memoryLimit: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Không tìm thấy lượt nộp!' }, { status: 404 });
    }

    let testResults = null;
    if (submission.testResults) {
      try {
        testResults = JSON.parse(submission.testResults);
        const hasMissingInputs = Array.isArray(testResults) && testResults.some((tr: any) => !tr.input || !tr.expectedOutput);
        if (hasMissingInputs) {
          const actualTestcases = await prisma.testcase.findMany({
            where: { problemId: submission.problemId },
            orderBy: { order: 'asc' },
          });
          testResults = testResults.map((tr: any, idx: number) => {
            const tc = actualTestcases[idx];
            return {
              ...tr,
              input: tr.input || tc?.input || '',
              expectedOutput: tr.expectedOutput || tc?.output || '',
              explanation: tr.explanation || tc?.explanation || undefined,
            };
          });
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      ...submission,
      testResults,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
