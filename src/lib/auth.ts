import { cookies, headers } from 'next/headers';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'admin123';

/**
 * Kiểm tra xác thực Admin từ headers hoặc cookies
 */
export async function verifyAdmin(): Promise<boolean> {
  // Check header x-admin-key
  const headerList = headers();
  const headerKey = headerList.get('x-admin-key');
  if (headerKey && headerKey === ADMIN_SECRET) {
    return true;
  }

  // Check cookie admin_key
  const cookieStore = cookies();
  const cookieKey = cookieStore.get('lsoj_admin_token')?.value;
  if (cookieKey && cookieKey === ADMIN_SECRET) {
    return true;
  }

  return false;
}
