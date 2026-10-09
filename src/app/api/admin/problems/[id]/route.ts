import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Cần quyền Quản trị viên!' }, { status: 403 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: params.id },
      include: {
        testcases: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Không tìm thấy bài tập!' }, { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Cần quyền Quản trị viên!' }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug,
      title,
      difficulty,
      timeLimit,
      memoryLimit,
      description,
      inputFormat,
      outputFormat,
      constraints,
      tags,
      testcases,
    } = body;

    // Check slug collision with other problems
    if (slug) {
      const existing = await prisma.problem.findFirst({
        where: {
          slug: slug.trim().toLowerCase(),
          NOT: { id: params.id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: `Mã bài "${slug}" đã bị trùng lặp!` }, { status: 400 });
      }
    }

    // Xóa toàn bộ testcase cũ và thêm lại
    await prisma.$transaction([
      prisma.testcase.deleteMany({
        where: { problemId: params.id },
      }),
      prisma.problem.update({
        where: { id: params.id },
        data: {
          slug: slug?.trim().toLowerCase(),
          title: title?.trim(),
          difficulty: difficulty || 'EASY',
          timeLimit: Number(timeLimit) || 1000,
          memoryLimit: Number(memoryLimit) || 262144,
          description: description?.trim(),
          inputFormat: inputFormat?.trim() || null,
          outputFormat: outputFormat?.trim() || null,
          constraints: constraints?.trim() || null,
          tags: tags?.trim() || null,
          testcases: {
            create: (testcases || []).map((tc: any, index: number) => ({
              input: tc.input || '',
              output: tc.output || '',
              isSample: Boolean(tc.isSample),
              explanation: tc.explanation?.trim() || null,
              order: index + 1,
            })),
          },
        },
      }),
    ]);

    const updated = await prisma.problem.findUnique({
      where: { id: params.id },
      include: { testcases: true },
    });

    return NextResponse.json({ success: true, problem: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Cần quyền Quản trị viên!' }, { status: 403 });
    }

    await prisma.problem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bài tập thành công!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
