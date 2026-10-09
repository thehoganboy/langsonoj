# LANG SON OJ - Nền Tảng Chấm Bài Trực Tuyến Hiện Đại (Online Judge)
**Phát triển bởi:** **NgHuyHoang**

**LANG SON OJ** là một hệ thống Online Judge (OJ) hiện đại, tinh gọn và hoàn chỉnh được xây dựng trên nền tảng **Next.js (App Router, TypeScript)**, sử dụng **Monaco Code Editor**, cơ sở dữ liệu **SQLite (Prisma ORM)** và tích hợp công cụ chấm bài mạnh mẽ **Judge0 API**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phía Người Dùng (Giao diện Luyện tập & Giải bài)
- **Kho bài tập thuật toán:**
  - Bộ lọc bài theo độ khó: Dễ (*Easy*), Trung bình (*Medium*), Khó (*Hard*).
  - Tìm kiếm tức thì theo tên bài, mã bài (*slug*) hoặc thẻ chủ đề (*tags*).
- **Trang làm bài Split-Screen chuyên nghiệp:**
  - **Cột trái:** Đề bài chi tiết với công thức toán học TeX/LaTeX mượt mà qua KaTeX (ví dụ: $O(N \log N)$, $\sum_{i=1}^n a_i$), quy cách I/O, ràng buộc dữ liệu, các ví dụ mẫu (*Sample Testcases*) kèm nút sao chép nhanh và tab lịch sử nộp bài của bài đó.
  - **Cột phải:**
    - Trình soạn thảo **Monaco Editor** chuẩn VS Code (hỗ trợ dark mode, syntax highlighting, format code, tab size 4).
    - Hỗ trợ ngôn ngữ: **C++ (GCC)**, **Python 3**, **Java (OpenJDK)** kèm code mẫu (*boilerplate*) chuẩn cho từng ngôn ngữ.
    - Bảng Console với 3 chế độ:
      - **Test Mẫu:** Xem trước và so khớp với các testcase ví dụ.
      - **Nhập Custom:** Tự do nhập standard input tùy ý để thử nghiệm code.
      - **Kết quả Chấm:** Hiển thị verdict, thời gian thực thi (ms), bộ nhớ (MB), số test đúng/sai, chi tiết log lỗi biên dịch (*Compile Error*) hoặc ngoại lệ thực thi (*Runtime Error*).
    - Nút **"Run Sample"**: Chạy thử với testcase mẫu hoặc custom input.
    - Nút **"Submit"**: Nộp bài chấm toàn bộ testcase bí mật (*Hidden Tests*). Pháo hoa ăn mừng tự động khi đạt **Accepted (AC)**!
- **Lịch sử nộp bài toàn hệ thống (`/submissions`):**
  - Bảng thống kê toàn bộ lượt nộp với nhãn phán quyết chuẩn CP: `AC`, `WA`, `TLE`, `MLE`, `CE`, `RTE`.
  - Hộp thoại Modal xem lại mã nguồn đã nộp, thời gian chạy, bộ nhớ sử dụng và chi tiết kết quả từng test.

### 2. Trang Quản Trị Viên (Admin Panel - `/admin`)
- **Bảo mật truy cập:** Xác thực bằng mật khẩu quản trị (*Admin Secret Key*).
- **Quản lý danh sách bài tập:** Xem, chỉnh sửa và xóa bài tập an toàn (tự động xóa dữ liệu liên quan).
- **Form Tạo / Sửa bài tập trực quan:**
  - Tên bài, Mã bài (*Slug*), Độ khó, Giới hạn thời gian (*ms*), Giới hạn bộ nhớ (*KB*), Tags.
  - Trình soạn thảo đề bài **Markdown** tích hợp tab **"Xem trước KaTeX"** thời gian thực.
  - **Bộ quản lý Testcases linh hoạt:**
    - Phân loại rõ ràng: **Sample Test** (công khai trong đề bài) và **Hidden Test** (bí mật chỉ dùng để chấm điểm).
    - Hỗ trợ nhập trực tiếp qua textarea hoặc **nạp nhanh từ file `.in` và `.out`**.

### 3. Quy trình Chấm bài (Judge Engine Flow)
1. **Tiếp nhận & Lưu trữ:** Tạo bản ghi submission với trạng thái ban đầu `PROCESSING` trong SQLite.
2. **Thực thi qua Sandbox:** Mã nguồn và standard input được gửi tới **Judge0 Sandbox** thông qua cơ chế mã hóa **Base64** an toàn tuyệt đối với mọi ký tự đặc biệt / non-ASCII.
3. **So khớp chuẩn CP:**
   - Chuẩn hóa line endings (`\r\n` $\rightarrow$ `\n`).
   - Tự động cắt bỏ khoảng trắng thừa cuối mỗi dòng và dòng trống ở cuối file.
4. **Phán quyết chuẩn xác:**
   - Dừng ngay lập tức nếu gặp lỗi biên dịch (`CE`).
   - Đánh giá từng testcase và tính toán thời gian chạy cực đại (Max Time), dung lượng RAM cao nhất (Max Memory).
   - Bảo mật testcases: Chỉ trả về input/output với Sample Tests, ẩn dữ liệu thô với Hidden Tests.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Chế độ tối Dark Mode phong cách Codeforces/LeetCode)
- **Code Editor:** [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Cơ sở dữ liệu:** SQLite thông qua [Prisma ORM](https://www.prisma.io/)
- **Toán học & Markdown:** `react-markdown`, `remark-math`, `rehype-katex`, `katex`
- **Judge Engine:** Tích hợp **Piston API** (`https://emkc.org/api/v2/piston/execute`) chạy trực tiếp, hoàn toàn miễn phí và không cần API key.
- **Hiệu ứng & Icons:** `lucide-react`, `canvas-confetti`

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu hệ thống
- Node.js version 18 trở lên (đã kiểm thử thành công trên Node.js v24)
- npm version 9 trở lên

### 2. Thiết lập Biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Nội dung cấu hình trong `.env`:
```env
# Piston API Engine (Public API, không cần API key)
# Mặc định dùng endpoint public: https://emkc.org/api/v2/piston/execute
# Hoặc trỏ tới server Piston tự host: http://localhost:2000/api/v2/execute
PISTON_API_URL=https://emkc.org/api/v2/piston/execute

# Mật khẩu quản trị viên (Admin Secret Key)
ADMIN_SECRET_KEY=admin123

# Đường dẫn database SQLite (Prisma)
DATABASE_URL="file:./dev.db"
```

> 💡 **Ưu điểm:** Piston API cho phép gửi trực tiếp source code và standard input (`stdin`), trả về kết quả ngay lập tức mà không cần tài khoản hay API key!

### 3. Cài đặt Dependencies & Khởi tạo Database
```bash
# Cài đặt các gói thư viện
npm install

# Khởi tạo bảng dữ liệu SQLite
npm run db:push

# Nạp dữ liệu các bài tập mẫu kinh điển (A+B, Fibonacci, Kadane, Trapping Rain Water)
npm run db:seed
```

### 4. Chạy Ứng Dụng

#### Chế độ Phát triển (Development):
```bash
npm run dev
```

#### Chế độ Sản xuất (Production):
```bash
npm run build
npm run start
```

Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
e:/LSOJ/
├── prisma/
│   ├── schema.prisma       # Định nghĩa Schema cho Problem, Testcase, Submission
│   └── seed.ts             # Script nạp dữ liệu bài tập mẫu ban đầu
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── problems/
│   │   │   │   ├── new/    # Trang tạo bài tập mới
│   │   │   │   └── [id]/edit/ # Trang sửa bài tập
│   │   │   └── page.tsx    # Dashboard quản trị & xác thực secret key
│   │   ├── api/
│   │   │   ├── admin/      # API xác thực, tạo/sửa/xóa bài tập
│   │   │   ├── judge/      # API /run (chạy thử) và /submit (chấm điểm)
│   │   │   ├── problems/   # API lấy danh sách và chi tiết bài tập
│   │   │   └── submissions/# API lịch sử lượt nộp bài
│   │   ├── problems/
│   │   │   ├── [slug]/     # Trang giải bài Split-Screen (Monaco + Console)
│   │   │   └── page.tsx    # Danh sách bài tập, bộ lọc độ khó, tìm kiếm
│   │   ├── submissions/    # Trang lịch sử nộp bài toàn hệ thống
│   │   ├── globals.css     # CSS toàn cục, tùy biến theme tối & KaTeX
│   │   ├── layout.tsx      # Root layout với Navbar
│   │   └── page.tsx        # Trang chủ ấn tượng với thống kê & bài tập nổi bật
│   ├── components/
│   │   ├── MarkdownRenderer.tsx # Render đề bài Markdown kèm KaTeX
│   │   ├── Navbar.tsx      # Thanh điều hướng chuẩn LeetCode/Codeforces
│   │   └── ProblemForm.tsx # Form tạo/sửa bài tập với KaTeX Live Preview
│   ├── lib/
│   │   ├── auth.ts         # Tiện ích xác thực Admin
│   │   ├── constants.ts    # Danh mục ngôn ngữ, code mẫu, màu sắc Verdict
│   │   ├── judge0.ts       # Module kết nối, polling và mapping Judge0 API
│   │   └── prisma.ts       # Prisma Client singleton
│   └── types/
│       └── index.ts        # TypeScript Interfaces & Types
├── .env.example            # Mẫu biến môi trường
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔒 Tài Khoản Quản Trị Mặc Định
- **Trang truy cập:** `/admin`
- **Admin Secret Key:** `admin123` (có thể thay đổi trong file `.env`)
