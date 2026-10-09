'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProblemForm from '@/components/ProblemForm';
import { AlertCircle } from 'lucide-react';

export default function EditProblemPage() {
  const params = useParams();
  const id = params.id as string;

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblemDetail();
  }, [id]);

  const fetchProblemDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/problems/${id}`);
      if (!res.ok) {
        throw new Error('Không thể tải thông tin bài tập để chỉnh sửa');
      }
      const data = await res.json();
      setProblem(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải bài tập');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0d14] text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span>Đang nạp dữ liệu bài tập và bộ testcases...</span>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#121824] border border-rose-500/30 p-6 rounded-xl max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h2 className="text-base font-bold text-white mb-1">Không tìm thấy bài tập</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Chỉnh Sửa Bài Tập & Testcases</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cập nhật thông tin bài #{problem.slug} và cấu hình lại bộ testcases chấm điểm
        </p>
      </div>

      <ProblemForm initialData={problem} isEdit={true} />
    </div>
  );
}
