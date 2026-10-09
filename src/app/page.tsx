import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DIFFICULTY_STYLES } from '@/lib/constants';
import { Difficulty } from '@/types';
import { Terminal, Shield, ArrowRight, Zap, Award, Sparkles, Code2, Cpu, CheckCircle2 } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const [problemCount, submissionCount, sampleProblems] = await Promise.all([
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.problem.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        timeLimit: true,
        memoryLimit: true,
        tags: true,
        _count: {
          select: { testcases: true, submissions: true },
        },
      },
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28 border-b border-slate-800/80 bg-radial-glow">
        {/* Glow decorative orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* System Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-xl mb-6 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-300">
              <strong className="text-white">LANG SON OJ</strong> • Online Judge System
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-cyan-400 font-mono font-semibold">Piston API Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
            Nền Tảng Thi Đấu Lập Trình{' '}
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent glow-text-blue">
              LANG SON OJ
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-400 mb-9 leading-relaxed font-normal">
            Hệ thống Online Judge tinh gọn, siêu tốc và chuẩn xác dành cho cộng đồng học sinh, sinh viên yêu thích Competitive Programming. Tích hợp Trình Soạn Thảo Chuyên Nghiệp (CodeMirror 6), KaTeX toán học và máy chấm sandbox Piston độc lập.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/problems"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center space-x-2.5 active:scale-95 border border-white/10"
            >
              <Code2 className="w-4 h-4" />
              <span>Khám phá kho bài tập</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 font-medium text-sm transition-all border border-slate-700/80 flex items-center space-x-2 shadow-lg backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Bảng Quản Trị (Admin)</span>
            </Link>
          </div>

          {/* Metrics Showcase Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16">
            <div className="glass-panel rounded-2xl p-4 text-center border-slate-800/80 hover:border-blue-500/40 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-mono">
                {problemCount}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Bài tập tuyển chọn</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center border-slate-800/80 hover:border-emerald-500/40 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono">
                {submissionCount}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Lượt nộp & chấm bài</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center border-slate-800/80 hover:border-purple-500/40 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                3+
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">C++, Python 3, Java</div>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center border-slate-800/80 hover:border-cyan-500/40 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                100%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Chuẩn Verdict CP</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-14 border-b border-slate-800/60 bg-[#07090e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Công Nghệ Hiện Đại Dành Cho Thí Sinh CP
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Được thiết kế tỉ mỉ nhằm mang lại trải nghiệm làm bài mượt mà và tối ưu nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6 glass-panel-hover border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Code Editor Siêu Tốc</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trình soạn thảo chuẩn CP (CodeMirror 6) cực nhạy: Syntax highlighting C++/Python/Java, auto-indent, tab 4 spaces, font Fira Code, không giật lag.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 glass-panel-hover border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Piston API Execution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chấm bài trực tiếp qua Piston Engine, không cần API key, gửi source code và stdin tương tác tốc độ cao trong sandbox biệt lập.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 glass-panel-hover border-slate-800/80">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">KaTeX TeX Math Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Render công thức toán học ma trận, tổ hợp, quy hoạch động siêu tốc, sắc nét trên mọi kích thước màn hình.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Problems Section */}
      <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Bài tập nổi bật</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                HOT
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rèn luyện thuật toán và tư duy lập trình thi đấu từ cơ bản đến nâng cao
            </p>
          </div>
          <Link
            href="/problems"
            className="text-xs text-blue-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold transition-colors"
          >
            <span>Xem tất cả bài tập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {sampleProblems.map((prob) => {
            const diffStyle = DIFFICULTY_STYLES[prob.difficulty as Difficulty] || DIFFICULTY_STYLES.EASY;
            return (
              <div
                key={prob.id}
                className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-800/80"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-cyan-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-md font-semibold">
                      {prob.slug}
                    </span>
                    <Link
                      href={`/problems/${prob.slug}`}
                      className="text-sm sm:text-base font-bold text-white hover:text-cyan-400 transition-colors"
                    >
                      {prob.title}
                    </Link>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${diffStyle.badge}`}>
                      {diffStyle.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="text-slate-300">⏱ {prob.timeLimit}ms</span>
                    <span>•</span>
                    <span className="text-slate-300">💾 {Math.round(prob.memoryLimit / 1024)}MB</span>
                    <span>•</span>
                    <span>{prob._count.testcases} testcases</span>
                    {prob.tags && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 font-sans">
                          {prob.tags.split(',').map((tag) => (
                            <span key={tag} className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Link
                    href={`/problems/${prob.slug}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all shadow-sm"
                  >
                    <span>Làm bài</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
