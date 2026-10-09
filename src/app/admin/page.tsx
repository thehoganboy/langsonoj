'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DIFFICULTY_STYLES } from '@/lib/constants';
import { Difficulty, ProblemDTO } from '@/types';
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  LogOut,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [problems, setProblems] = useState<ProblemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setIsAdmin(data.isAdmin);
      if (data.isAdmin) {
        fetchAdminProblems();
      }
    } catch (err) {
      console.error(err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sai mật khẩu quản trị');
      }

      setIsAdmin(true);
      fetchAdminProblems();
    } catch (err: any) {
      setAuthError(err.message || 'Mã bí mật không chính xác');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAdmin(false);
    setAdminKey('');
  };

  const fetchAdminProblems = async () => {
    try {
      const res = await fetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProblem = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài tập "${title}"? Mọi testcase và lịch sử nộp bài liên quan sẽ bị xóa.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/problems/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Không thể xóa bài tập');
      }
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0d14] text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span>Đang kiểm tra quyền quản trị...</span>
      </div>
    );
  }

  // Login view if not authenticated
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#0a0d14]">
        <div className="max-w-md w-full bg-[#0f141d] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-center text-white mb-2">
            Xác Thực Quyền Quản Trị
          </h2>
          <p className="text-xs text-center text-slate-400 mb-6">
            Nhập <strong>ADMIN_SECRET_KEY</strong> được cấu hình trong file <code className="text-amber-300">.env</code> để truy cập bảng quản trị.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mã bí mật Admin (Admin Secret Key)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Nhập mã bí mật (mặc định: admin123)..."
                required
                className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              Mở khóa Quản trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Shield className="w-6 h-6 text-amber-400" />
              <span>LANG SON OJ - Quản Trị Hệ Thống</span>
            </h1>
            <span className="text-[11px] font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Dev: NgHuyHoang
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Quản lý kho bài tập thuật toán, cấu hình bộ testcases (Sample & Hidden) và giám sát hệ thống Judge0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/sample.txt"
            download="sample.txt"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium transition-all"
            title="Tải file mẫu định dạng .txt để tạo bài nhanh"
          >
            <Download className="w-3.5 h-3.5" />
            <span>sample.txt</span>
          </a>

          <a
            href="/guild.txt"
            download="guild.txt"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
            title="Tải hướng dẫn điền file mẫu"
          >
            <Download className="w-3.5 h-3.5" />
            <span>guild.txt</span>
          </a>

          <Link
            href="/admin/problems/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bài tập mới</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Đăng xuất Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{problems.length}</div>
            <div className="text-xs text-slate-400">Tổng số bài tập</div>
          </div>
        </div>

        <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {problems.reduce((acc, p) => acc + (p._count?.testcases || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Tổng số Testcases</div>
          </div>
        </div>

        <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">Piston API Engine</div>
            <div className="text-xs text-slate-400">Trạng thái: Hoạt động (Public)</div>
          </div>
        </div>
      </div>

      {/* Problems Management Table */}
      <div className="bg-[#0f141d] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121824]">
          <h3 className="text-sm font-bold text-white">Danh Sách Bài Tập Đang Quản Lý</h3>
          <span className="text-xs text-slate-400">{problems.length} bài</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#141b28] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Tên bài & Slug</th>
                <th className="py-3.5 px-4 w-28 text-center">Độ khó</th>
                <th className="py-3.5 px-4 text-center">Giới hạn</th>
                <th className="py-3.5 px-4 text-center">Testcases</th>
                <th className="py-3.5 px-4 text-center">Lượt nộp</th>
                <th className="py-3.5 px-4 text-right w-36">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {problems.map((prob, idx) => {
                const diffStyle =
                  DIFFICULTY_STYLES[prob.difficulty as Difficulty] || DIFFICULTY_STYLES.EASY;

                return (
                  <tr key={prob.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 text-center font-mono text-slate-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{prob.title}</div>
                      <div className="text-xs font-mono text-slate-400">{prob.slug}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${diffStyle.badge}`}
                      >
                        {diffStyle.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-mono text-slate-400">
                      <div>{prob.timeLimit} ms</div>
                      <div>{Math.round(prob.memoryLimit / 1024)} MB</div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs">
                      <span className="text-blue-400 font-bold">
                        {prob._count?.testcases || 0}
                      </span>{' '}
                      tests
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                      {prob._count?.submissions || 0}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/problems/${prob.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Xem trang làm bài"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/problems/${prob.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                          title="Chỉnh sửa bài tập & Testcases"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProblem(prob.id, prob.title)}
                          disabled={deletingId === prob.id}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 disabled:opacity-50"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
