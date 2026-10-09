'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DIFFICULTY_STYLES } from '@/lib/constants';
import { Difficulty, ProblemDTO } from '@/types';
import { Search, Code2, ArrowUpRight, Cpu, Clock, HardDrive, Sparkles } from 'lucide-react';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài tập:', err);
    } finally {
      setLoading(false);
    }
  };

  const allTags = Array.from(
    new Set(
      problems
        .flatMap((p) => (p.tags ? p.tags.split(',').map((t) => t.trim()) : []))
        .filter(Boolean)
    )
  );

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(search.toLowerCase()));

    const matchesDifficulty =
      difficultyFilter === 'ALL' || p.difficulty === difficultyFilter;

    const matchesTag =
      tagFilter === 'ALL' ||
      (p.tags && p.tags.split(',').map((t) => t.trim()).includes(tagFilter));

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Kho Bài Tập Thuật Toán
            </h1>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full shadow-inner">
              LANG SON OJ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 flex items-center space-x-2">
            <span>Rèn luyện kỹ năng giải thuật và tư duy thi đấu Competitive Programming</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs font-mono">
              Dev: <span className="text-cyan-400 font-semibold">NgHuyHoang</span>
            </span>
          </p>
        </div>

        <Link
          href="/admin/problems/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all shadow-md self-start sm:self-auto hover:border-blue-500/40"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Thêm bài tập mới (Admin)</span>
        </Link>
      </div>

      {/* Controls: Search and Filters */}
      <div className="glass-panel border-slate-800/90 rounded-2xl p-4 sm:p-5 mb-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài, slug, chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Difficulty Filter Tabs */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => {
              const label =
                diff === 'ALL'
                  ? 'Tất cả độ khó'
                  : DIFFICULTY_STYLES[diff as Difficulty]?.label || diff;

              return (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    difficultyFilter === diff
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags quick selector */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 text-[11px] font-mono mr-1">Chủ đề:</span>
            <button
              onClick={() => setTagFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                tagFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Tất cả
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  tagFilter === tag
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Problems Table */}
      <div className="glass-panel border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0b0e15] text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 w-12 text-center">#</th>
                <th className="py-4 px-4">Tên bài tập</th>
                <th className="py-4 px-4 w-28 text-center">Độ khó</th>
                <th className="py-4 px-4 hidden md:table-cell w-36">Giới hạn</th>
                <th className="py-4 px-4 hidden lg:table-cell">Chủ đề</th>
                <th className="py-4 px-4 text-center w-28">Lượt nộp</th>
                <th className="py-4 px-4 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-mono text-xs">LANG SON OJ đang nạp danh sách bài tập...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-mono text-xs">
                    Không tìm thấy bài tập nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((prob, idx) => {
                  const diffStyle =
                    DIFFICULTY_STYLES[prob.difficulty as Difficulty] || DIFFICULTY_STYLES.EASY;

                  return (
                    <tr
                      key={prob.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-4 text-center font-mono text-slate-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/problems/${prob.slug}`}
                            className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center space-x-2"
                          >
                            <span>{prob.title}</span>
                          </Link>
                          <div className="text-[11px] font-mono text-slate-500">
                            {prob.slug}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${diffStyle.badge}`}
                        >
                          {diffStyle.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-400 space-y-1 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{prob.timeLimit} ms</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                          <span>{Math.round(prob.memoryLimit / 1024)} MB</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {prob.tags ? (
                            prob.tags.split(',').map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                              >
                                #{tag.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                        {prob._count?.submissions || 0}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/problems/${prob.slug}`}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
                        >
                          <span>Giải</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
