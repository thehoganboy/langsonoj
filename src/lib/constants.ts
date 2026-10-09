import { LanguageConfig, Difficulty, Verdict } from '@/types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 54, // C++ (GCC)
    name: 'C++ (GCC)',
    monacoLang: 'cpp',
    fileExtension: 'cpp',
    pistonLang: 'cpp',
    pistonFile: 'solution.cpp',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Viết code giải bài tại đây
    
    return 0;
}
`,
  },
  {
    id: 71, // Python 3
    name: 'Python 3',
    monacoLang: 'python',
    fileExtension: 'py',
    pistonLang: 'python',
    pistonFile: 'solution.py',
    defaultCode: `import sys

def solve():
    # Đọc input từ sys.stdin
    # input_data = sys.stdin.read().split()
    pass

if __name__ == '__main__':
    solve()
`,
  },
  {
    id: 62, // Java (OpenJDK)
    name: 'Java (OpenJDK)',
    monacoLang: 'java',
    fileExtension: 'java',
    pistonLang: 'java',
    pistonFile: 'Main.java',
    defaultCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Viết code giải bài tại đây
        
        scanner.close();
    }
}
`,
  },
];

export const DIFFICULTY_STYLES: Record<Difficulty, { label: string; badge: string; bg: string; text: string }> = {
  EASY: {
    label: 'Dễ',
    badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  MEDIUM: {
    label: 'Trung bình',
    badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    bg: 'bg-amber-500',
    text: 'text-amber-400',
  },
  HARD: {
    label: 'Khó',
    badge: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    bg: 'bg-rose-500',
    text: 'text-rose-400',
  },
};

export const VERDICT_CONFIG: Record<Verdict, { label: string; short: string; badge: string; color: string; desc: string }> = {
  AC: {
    label: 'Accepted',
    short: 'AC',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    color: '#22c55e',
    desc: 'Chấp nhận - Tất cả testcase đều chính xác',
  },
  WA: {
    label: 'Wrong Answer',
    short: 'WA',
    badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    color: '#ef4444',
    desc: 'Kết quả sai - Output không khớp với testcase chuẩn',
  },
  TLE: {
    label: 'Time Limit Exceeded',
    short: 'TLE',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    color: '#f59e0b',
    desc: 'Quá thời gian - Chương trình chạy lâu hơn giới hạn cho phép',
  },
  MLE: {
    label: 'Memory Limit Exceeded',
    short: 'MLE',
    badge: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    color: '#a855f7',
    desc: 'Quá bộ nhớ - Chương trình sử dụng vượt quá dung lượng RAM',
  },
  CE: {
    label: 'Compile Error',
    short: 'CE',
    badge: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    color: '#06b6d4',
    desc: 'Lỗi biên dịch - Code không thể compile thành công',
  },
  RTE: {
    label: 'Runtime Error',
    short: 'RTE',
    badge: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
    color: '#ec4899',
    desc: 'Lỗi thực thi - Lỗi bộ nhớ, chia cho 0, hoặc ngoại lệ crash',
  },
  'In Queue': {
    label: 'In Queue',
    short: 'QUEUE',
    badge: 'bg-gray-500/15 text-gray-400 border border-gray-500/30 animate-pulse',
    color: '#9ca3af',
    desc: 'Đang xếp hàng chờ chấm',
  },
  Processing: {
    label: 'Running',
    short: 'RUNNING',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse',
    color: '#3b82f6',
    desc: 'Đang thực thi các testcases',
  },
};
