import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { key } = await req.json();
    const adminKey = process.env.ADMIN_SECRET_KEY || 'admin123';

    if (!key || key !== adminKey) {
      return NextResponse.json({ error: 'Mã bí mật Admin không chính xác!' }, { status: 401 });
    }

    const cookieStore = cookies();
    cookieStore.set('lsoj_admin_token', adminKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: 'Đăng nhập Admin thành công!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý' }, { status: 500 });
  }
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  return NextResponse.json({ isAdmin });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('lsoj_admin_token');
  return NextResponse.json({ success: true, message: 'Đã đăng xuất Admin' });
}
