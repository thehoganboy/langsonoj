'use client';

import React from 'react';
import ProblemForm from '@/components/ProblemForm';

export default function NewProblemPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Thêm Bài Tập Thuật Toán Mới</h1>
        <p className="text-xs text-slate-400 mt-1">
          Thiết lập đề bài, công thức toán học KaTeX và cấu hình bộ testcases chấm điểm
        </p>
      </div>

      <ProblemForm isEdit={false} />
    </div>
  );
}
