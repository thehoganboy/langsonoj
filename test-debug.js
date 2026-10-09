const fs = require('fs');

async function runTests() {
  console.log('====================================================');
  console.log('   LANG SON OJ - TOÀN DIỆN KIỂM TRA & DEBUGGING');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  [PASS]', message);
      passed++;
    } else {
      console.error('  [FAIL]', message);
      failed++;
    }
  }

  const BASE_URL = 'http://localhost:3000';

  // 1. Health Check Endpoint
  console.log('--- 1. Kiểm tra Health Check Endpoint (/api/health) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, 'HTTP status là 200');
    assert(data.status === 'ok', 'Status là "ok"');
    assert(data.database === 'connected', 'Database kết nối thành công (PostgreSQL Supabase)');
    assert(data.service === 'LANG SON OJ', 'Tên dịch vụ là "LANG SON OJ"');
  } catch (e) {
    assert(false, `Lỗi /api/health: ${e.message}`);
  }

  // 2. Trang chủ & Branding
  console.log('\n--- 2. Kiểm tra Trang Chủ & Thương hiệu ---');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    assert(res.status === 200, 'HTTP status trang chủ là 200');
    assert(html.includes('LANG SON OJ'), 'Chứa tên thương hiệu LANG SON OJ');
    assert(html.includes('NgHuyHoang'), 'Chứa tác giả Dev: NgHuyHoang');
  } catch (e) {
    assert(false, `Lỗi trang chủ: ${e.message}`);
  }

  // 3. Tải file tĩnh mẫu
  console.log('\n--- 3. Kiểm tra Tải file mẫu (/sample.txt & /guild.txt) ---');
  try {
    const rSample = await fetch(`${BASE_URL}/sample.txt`);
    const tSample = await rSample.text();
    assert(rSample.status === 200, 'Tải /sample.txt HTTP 200');
    assert(tSample.includes('=== TITLE ===') && tSample.includes('=== TESTCASES ==='), 'Nội dung sample.txt hợp lệ');

    const rGuild = await fetch(`${BASE_URL}/guild.txt`);
    const tGuild = await rGuild.text();
    assert(rGuild.status === 200, 'Tải /guild.txt HTTP 200');
    assert(tGuild.includes('HƯỚNG DẪN ĐIỀN FILE MẪU'), 'Nội dung guild.txt hợp lệ');
  } catch (e) {
    assert(false, `Lỗi file tĩnh: ${e.message}`);
  }

  // 4. API Lấy danh sách bài tập
  console.log('\n--- 4. Kiểm tra API Danh Sách Bài Tập (/api/problems) ---');
  let problems = [];
  try {
    const res = await fetch(`${BASE_URL}/api/problems`);
    problems = await res.json();
    assert(res.status === 200, 'HTTP status là 200');
    assert(Array.isArray(problems) && problems.length > 0, `Có ${problems.length} bài tập trong cơ sở dữ liệu`);
  } catch (e) {
    assert(false, `Lỗi /api/problems: ${e.message}`);
  }

  // 5. API Chi tiết bài tập & Test Ẩn
  console.log('\n--- 5. Kiểm tra API Chi Tiết Bài Tập & Mở Khóa Test Ẩn ---');
  try {
    // Không kèm includeAll -> chỉ ra sample
    const r1 = await fetch(`${BASE_URL}/api/problems/aplusb`);
    const d1 = await r1.json();
    assert(r1.status === 200, 'Lấy bài aplusb HTTP 200');
    assert(d1.testcases.every(t => t.isSample === true), 'Mặc định chỉ trả về Sample Testcases');

    // Kèm includeAll=true -> ra cả sample và hidden
    const r2 = await fetch(`${BASE_URL}/api/problems/aplusb?includeAll=true`);
    const d2 = await r2.json();
    assert(r2.status === 200, 'Lấy bài aplusb?includeAll=true HTTP 200');
    const hasHidden = d2.testcases.some(t => t.isSample === false);
    assert(hasHidden, `Mở khóa thành công test ẩn (${d2.testcases.length} tests tổng cộng)`);
  } catch (e) {
    assert(false, `Lỗi chi tiết bài tập: ${e.message}`);
  }

  // 6. Chấm bài Piston API: C++, Python, Java
  console.log('\n--- 6. Kiểm tra Máy Chấm Piston API (Run & Multi-language) ---');
  const aplusbId = problems.find(p => p.slug === 'aplusb')?.id;

  if (aplusbId) {
    // 6a. C++ Test Run
    try {
      const cppCode = '#include <iostream>\nusing namespace std;\nint main() { int a, b; if (cin >> a >> b) cout << a + b << endl; return 0; }';
      const r = await fetch(`${BASE_URL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: aplusbId,
          languageId: 54, // C++
          sourceCode: cppCode
        })
      });
      const d = await r.json();
      assert(r.status === 200, 'Thực thi C++ HTTP 200');
      assert(d.overallVerdict === 'AC', `C++ Sample Run Verdict: ${d.overallVerdict}`);
    } catch (e) {
      assert(false, `Lỗi C++ Run: ${e.message}`);
    }

    // 6b. Python 3 Test Run
    try {
      const pyCode = 'import sys\nlines = sys.stdin.read().split()\nif lines:\n    print(int(lines[0]) + int(lines[1]))\n';
      const r = await fetch(`${BASE_URL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: aplusbId,
          languageId: 71, // Python 3
          sourceCode: pyCode
        })
      });
      const d = await r.json();
      assert(r.status === 200, 'Thực thi Python 3 HTTP 200');
      assert(d.overallVerdict === 'AC', `Python 3 Sample Run Verdict: ${d.overallVerdict}`);
    } catch (e) {
      assert(false, `Lỗi Python 3 Run: ${e.message}`);
    }

    // 6c. Custom Input Run
    try {
      const cppCode = '#include <iostream>\nusing namespace std;\nint main() { int a, b; if (cin >> a >> b) cout << a * b << endl; return 0; }';
      const r = await fetch(`${BASE_URL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: aplusbId,
          languageId: 54,
          sourceCode: cppCode,
          customInput: '7 8'
        })
      });
      const d = await r.json();
      assert(r.status === 200, 'Custom Input Run HTTP 200');
      assert(d.stdout && d.stdout.trim() === '56', `Custom Input Stdout chính xác: ${d.stdout?.trim()}`);
    } catch (e) {
      assert(false, `Lỗi Custom Input Run: ${e.message}`);
    }

    // 6d. Nộp bài chính thức (Submit) & Kiểm tra Hidden Tests xem được
    console.log('\n--- 7. Kiểm tra Submit Chấm Đầy Đủ & Dữ Liệu Hidden Tests ---');
    try {
      const cppCode = '#include <iostream>\nusing namespace std;\nint main() { int a, b; if (cin >> a >> b) cout << a + b << endl; return 0; }';
      const r = await fetch(`${BASE_URL}/api/judge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: aplusbId,
          languageId: 54,
          sourceCode: cppCode
        })
      });
      const d = await r.json();
      assert(r.status === 200, 'Nộp bài Submit HTTP 200');
      assert(d.submission && d.submission.verdict === 'AC', `Submit Verdict: ${d.submission?.verdict}`);
      
      // Kiểm tra xem testResults có đầy đủ input/output của hidden tests không
      const testResults = d.submission.testResults;
      assert(Array.isArray(testResults) && testResults.length > 0, `Đã chấm xong ${testResults?.length} tests`);
      const hiddenTest = testResults.find(t => !t.isSample);
      assert(hiddenTest && hiddenTest.input !== undefined, `Hidden Test #${hiddenTest?.testIndex} có trường Input hiển thị được`);
      assert(hiddenTest && hiddenTest.expectedOutput !== undefined, `Hidden Test #${hiddenTest?.testIndex} có trường Expected Output hiển thị được`);
      assert(hiddenTest && hiddenTest.stdout !== undefined, `Hidden Test #${hiddenTest?.testIndex} có trường Stdout hiển thị được`);
    } catch (e) {
      assert(false, `Lỗi Submit: ${e.message}`);
    }
  }

  // 8. Kiểm tra Xác thực Quản trị Admin
  console.log('\n--- 8. Kiểm tra Xác Thực Quản Trị (/api/admin/auth) ---');
  let adminCookie = '';
  try {
    // Thử sai mật khẩu
    const rWrong = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'wrong-password-123' })
    });
    assert(rWrong.status === 401, 'Mật khẩu sai bị từ chối với HTTP 401');

    // Thử đúng mật khẩu (admin123)
    const rRight = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'admin123' })
    });
    assert(rRight.status === 200, 'Mật khẩu đúng (admin123) đăng nhập thành công với HTTP 200');
    adminCookie = rRight.headers.get('set-cookie') || '';
  } catch (e) {
    assert(false, `Lỗi Admin Auth: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`   KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('\n HỆ THỐNG HOÀN TOÀN KHÔNG CÓ LỖI! SẴN SÀNG 100% ĐỂ SỬ DỤNG.');
  } else {
    console.error('\n Có lỗi cần kiểm tra xử lý.');
  }
}

runTests();
