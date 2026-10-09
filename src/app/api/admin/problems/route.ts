import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Truy cập bị từ chối. Cần quyền Quản trị viên!' }, { status: 403 });
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

    if (!slug || !title || !description) {
      return NextResponse.json({ error: 'Vui lòng điền đủ Mã bài (Slug), Tên bài và Đề bài!' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.problem.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: `Mã bài "${slug}" đã tồn tại. Vui lòng chọn slug khác!` }, { status: 400 });
    }

    const problem = await prisma.problem.create({
      data: {
        slug: slug.trim().toLowerCase(),
        title: title.trim(),
        difficulty: difficulty || 'EASY',
        timeLimit: Number(timeLimit) || 1000,
        memoryLimit: Number(memoryLimit) || 262144,
        description: description.trim(),
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
      include: {
        testcases: true,
      },
    });

    return NextResponse.json({ success: true, problem }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi khi tạo bài tập:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi tạo bài tập' }, { status: 500 });
  }
}
