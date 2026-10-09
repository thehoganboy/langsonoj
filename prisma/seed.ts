import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial CP problems...');

  // Xóa dữ liệu cũ nếu có
  await prisma.testcase.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.problem.deleteMany({});

  // Bài 1: A + B Problem
  const prob1 = await prisma.problem.create({
    data: {
      slug: 'aplusb',
      title: 'A + B Problem (Tính Tổng Hai Số)',
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 262144,
      tags: 'Math,Basic',
      description: `### Đề bài
Cho hai số nguyên $a$ và $b$. Hãy tính tổng $a + b$.

Đây là bài toán khởi động kinh điển trong lập trình thi đấu để kiểm tra môi trường nhập/xuất chuẩn (Standard I/O).

### Quy cách nhập (Input)
- Một dòng duy nhất chứa 2 số nguyên $a$ và $b$ cách nhau bởi dấu cách ($-10^9 \\le a, b \\le 10^9$).

### Quy cách xuất (Output)
- In ra một số nguyên duy nhất là kết quả của $a + b$.`,
      inputFormat: 'Gồm 2 số nguyên a và b (-10^9 <= a, b <= 10^9) trên 1 dòng.',
      outputFormat: 'In ra giá trị tổng a + b.',
      constraints: '$-10^9 \\le a, b \\le 10^9$',
      testcases: {
        create: [
          {
            input: '3 5\n',
            output: '8\n',
            isSample: true,
            explanation: '3 + 5 = 8',
            order: 1,
          },
          {
            input: '100 -20\n',
            output: '80\n',
            isSample: true,
            explanation: '100 + (-20) = 80',
            order: 2,
          },
          {
            input: '0 0\n',
            output: '0\n',
            isSample: false,
            order: 3,
          },
          {
            input: '-500000000 -500000000\n',
            output: '-1000000000\n',
            isSample: false,
            order: 4,
          },
          {
            input: '1000000000 1000000000\n',
            output: '2000000000\n',
            isSample: false,
            order: 5,
          },
        ],
      },
    },
  });

  // Bài 2: Số Fibonacci Thứ N
  const prob2 = await prisma.problem.create({
    data: {
      slug: 'fibonacci-number',
      title: 'Số Fibonacci Thứ N',
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 262144,
      tags: 'DP,Math,Recursion',
      description: `### Đề bài
Dãy số Fibonacci được định nghĩa như sau:
$$F_0 = 0$$
$$F_1 = 1$$
$$F_n = F_{n-1} + F_{n-2} \\quad (với \\; n \\ge 2)$$

Cho số nguyên $n$. Hãy tìm số Fibonacci thứ $n$. Vì kết quả có thể rất lớn, hãy in ra kết quả theo modulo $10^9 + 7$.

### Quy cách nhập (Input)
- Dòng duy nhất chứa số nguyên $n$ ($0 \\le n \\le 10^5$).

### Quy cách xuất (Output)
- In ra giá trị $F_n \\pmod{10^9 + 7}$.`,
      inputFormat: 'Một số nguyên n (0 <= n <= 100000).',
      outputFormat: 'Giá trị F_n chia lấy dư cho 10^9 + 7.',
      constraints: '$0 \\le n \\le 10^5$',
      testcases: {
        create: [
          {
            input: '2\n',
            output: '1\n',
            isSample: true,
            explanation: 'F_2 = F_1 + F_0 = 1 + 0 = 1',
            order: 1,
          },
          {
            input: '5\n',
            output: '5\n',
            isSample: true,
            explanation: 'Dãy Fibonacci: 0, 1, 1, 2, 3, 5. Vậy F_5 = 5',
            order: 2,
          },
          {
            input: '0\n',
            output: '0\n',
            isSample: false,
            order: 3,
          },
          {
            input: '10\n',
            output: '55\n',
            isSample: false,
            order: 4,
          },
          {
            input: '50\n',
            output: '586268941\n',
            isSample: false,
            order: 5,
          },
        ],
      },
    },
  });

  // Bài 3: Maximum Subarray Sum (Thuật toán Kadane)
  const prob3 = await prisma.problem.create({
    data: {
      slug: 'max-subarray-sum',
      title: 'Dãy Con Có Tổng Lớn Nhất (Kadane)',
      difficulty: 'MEDIUM',
      timeLimit: 1500,
      memoryLimit: 262144,
      tags: 'Array,Dynamic Programming,Divide and Conquer',
      description: `### Đề bài
Cho một mảng số nguyên $A = [a_1, a_2, \\dots, a_n]$ gồm $n$ phần tử. 

Hãy tìm một dãy con liên tiếp (subarray) có ít nhất 1 phần tử sao cho tổng các phần tử trong dãy con đó đạt giá trị **lớn nhất**.

### Quy cách nhập (Input)
- Dòng đầu tiên chứa số nguyên $n$ ($1 \\le n \\le 2 \\times 10^5$).
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \\dots, a_n$ ($-10^9 \\le a_i \\le 10^9$).

### Quy cách xuất (Output)
- In ra một số nguyên duy nhất: tổng lớn nhất tìm được.`,
      inputFormat: 'Dòng 1: n (1 <= n <= 2*10^5). Dòng 2: n số nguyên a_i.',
      outputFormat: 'Tổng lớn nhất của dãy con liên tiếp.',
      constraints: '$1 \\le n \\le 2 \\times 10^5$, $|a_i| \\le 10^9$',
      testcases: {
        create: [
          {
            input: '8\n-2 -3 4 -1 -2 1 5 -3\n',
            output: '7\n',
            isSample: true,
            explanation: 'Dãy con liên tiếp [4, -1, -2, 1, 5] có tổng lớn nhất là 4 - 1 - 2 + 1 + 5 = 7.',
            order: 1,
          },
          {
            input: '5\n-5 -2 -8 -1 -4\n',
            output: '-1\n',
            isSample: true,
            explanation: 'Toàn bộ số âm, chọn 1 phần tử lớn nhất là -1.',
            order: 2,
          },
          {
            input: '1\n42\n',
            output: '42\n',
            isSample: false,
            order: 3,
          },
          {
            input: '6\n1 2 3 4 5 6\n',
            output: '21\n',
            isSample: false,
            order: 4,
          },
          {
            input: '7\n-10 20 -5 15 -100 50 -10\n',
            output: '50\n',
            isSample: false,
            order: 5,
          },
        ],
      },
    },
  });

  // Bài 4: Trapping Rain Water (Hứng Nước Mưa)
  const prob4 = await prisma.problem.create({
    data: {
      slug: 'trapping-rain-water',
      title: 'Hứng Nước Mưa (Trapping Rain Water)',
      difficulty: 'HARD',
      timeLimit: 1000,
      memoryLimit: 262144,
      tags: 'Two Pointers,Stack,Dynamic Programming',
      description: `### Đề bài
Cho $n$ số nguyên không âm đại diện cho bản đồ độ cao (elevation map) của các cột có bề rộng bằng $1$. Hãy tính lượng nước mưa có thể giữ lại được sau khi trời mưa.

$$\\text{Total Water} = \\sum_{i=1}^n \\max(0, \\min(\\text{max\\_left}_i, \\text{max\\_right}_i) - h_i)$$

### Quy cách nhập (Input)
- Dòng đầu tiên chứa số nguyên $n$ ($1 \\le n \\le 10^5$).
- Dòng thứ hai chứa $n$ số nguyên không âm $h_1, h_2, \\dots, h_n$ ($0 \\le h_i \\le 10^5$).

### Quy cách xuất (Output)
- In ra một số nguyên duy nhất là tổng đơn vị nước mưa được giữ lại.`,
      inputFormat: 'Dòng 1: n. Dòng 2: n số nguyên đại diện độ cao các cột.',
      outputFormat: 'Tổng lượng nước giữ lại.',
      constraints: '$1 \\le n \\le 10^5, 0 \\le h_i \\le 10^5$',
      testcases: {
        create: [
          {
            input: '12\n0 1 0 2 1 0 1 3 2 1 2 1\n',
            output: '6\n',
            isSample: true,
            explanation: 'Tại các vị trí trũng, tổng cộng giữ lại được 6 đơn vị nước.',
            order: 1,
          },
          {
            input: '6\n4 2 0 3 2 5\n',
            output: '9\n',
            isSample: true,
            explanation: 'Tổng lượng nước hứng được là 9.',
            order: 2,
          },
          {
            input: '3\n3 2 1\n',
            output: '0\n',
            isSample: false,
            order: 3,
          },
        ],
      },
    },
  });

  console.log(`Seeded 4 problems: ${prob1.title}, ${prob2.title}, ${prob3.title}, ${prob4.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
