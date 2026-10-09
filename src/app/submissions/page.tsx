'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VERDICT_CONFIG } from '@/lib/constants';
import { SubmissionDTO, Verdict } from '@/types';
import { History, Eye, Copy, Check, Clock, HardDrive, X, Code2 } from 'lucide-react';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDTO | null>(null);
  const [activeModalTestIdx, setActiveModalTestIdx] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedExpected, setCopiedExpected] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/submissions?limit=50');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Lịch Sử Chấm Bài
            </h1>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
              LANG SON OJ
            </span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              {submissions.length} lượt nộp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Theo dõi các lượt nộp bài, kết quả phán quyết và thống kê thời gian thực thi
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
        >
          Làm mới
        </button>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#0f141d] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#121824] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">ID</th>
                <th className="py-3.5 px-4">Bài tập</th>
                <th className="py-3.5 px-4 w-32 text-center">Phán quyết</th>
                <th className="py-3.5 px-4">Ngôn ngữ</th>
                <th className="py-3.5 px-4 text-center">Tests đúng</th>
                <th className="py-3.5 px-4 text-center">Thời gian</th>
                <th className="py-3.5 px-4 text-center">Bộ nhớ</th>
                <th className="py-3.5 px-4 text-right">Thời điểm</th>
                <th className="py-3.5 px-4 w-20 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải lịch sử nộp bài...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Chưa có lượt nộp bài nào trên hệ thống. Hãy vào mục Bài tập để nộp bài đầu tiên!
                  </td>
                </tr>
              ) : (
                submissions.map((sub, idx) => {
                  const vCfg = VERDICT_CONFIG[sub.verdict as Verdict] || VERDICT_CONFIG.WA;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <td className="py-4 px-4 text-center font-mono text-slate-500 text-xs">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          {sub.problem ? (
                            <Link
                              href={`/problems/${sub.problem.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-white hover:text-blue-400 transition-colors"
                            >
                              {sub.problem.title}
                            </Link>
                          ) : (
                            <span className="text-slate-400">Bài tập #{sub.problemId}</span>
                          )}
                          <div className="text-[11px] font-mono text-slate-500">
                            {sub.problem?.slug}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${vCfg.badge}`}
                        >
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-300">
                        {sub.language}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs">
                        <span
                          className={
                            sub.passedTests === sub.totalTests && sub.totalTests > 0
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {sub.passedTests} / {sub.totalTests}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                        {sub.time ? `${(sub.time * 1000).toFixed(0)} ms` : '-'}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                        {sub.memory ? `${(sub.memory / 1024).toFixed(1)} MB` : '-'}
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-slate-400">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(sub);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                          title="Xem chi tiết code và test"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10141d] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#131924]">
              <div className="flex items-center space-x-3">
                <Code2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Chi tiết Lượt nộp #{selectedSubmission.id.slice(0, 8)}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedSubmission.problem?.title} • {selectedSubmission.language}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    VERDICT_CONFIG[selectedSubmission.verdict as Verdict]?.badge || ''
                  }`}
                >
                  {selectedSubmission.verdict}
                </span>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 bg-[#151c28] p-3 rounded-xl border border-slate-800/80 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Testcases</span>
                  <span className="text-sm font-bold text-white">
                    {selectedSubmission.passedTests} / {selectedSubmission.totalTests}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Thời gian</span>
                  <span className="text-sm font-bold text-white">
                    {selectedSubmission.time ? `${(selectedSubmission.time * 1000).toFixed(0)} ms` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Bộ nhớ</span>
                  <span className="text-sm font-bold text-white">
                    {selectedSubmission.memory ? `${(selectedSubmission.memory / 1024).toFixed(1)} MB` : '-'}
                  </span>
                </div>
              </div>

              {/* Error messages if any */}
              {(selectedSubmission.compileOutput || selectedSubmission.stderr) && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300">
                  <strong className="block mb-1 text-rose-400">Thông báo lỗi:</strong>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] overflow-x-auto">
                    {selectedSubmission.compileOutput || selectedSubmission.stderr}
                  </pre>
                </div>
              )}

              {/* Testcases Breakdown & Hidden Tests Inspector */}
              {selectedSubmission.testResults && selectedSubmission.testResults.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        Chi tiết {selectedSubmission.testResults.length} Testcases đã chấm:
                      </span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                        🔓 Mở khóa Test Ẩn
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Bấm vào từng test để xem Input và Output
                    </span>
                  </div>

                  {/* Test selection tabs */}
                  <div className="flex flex-wrap gap-1.5 pb-1 max-h-28 overflow-y-auto">
                    {selectedSubmission.testResults.map((tr, idx) => {
                      const isTestAC = tr.verdict === 'AC';
                      const isSelected = activeModalTestIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveModalTestIdx(idx)}
                          className={`px-2.5 py-1 rounded-lg border text-left font-mono text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500/20 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                              : isTestAC
                              ? 'bg-[#151c28] hover:bg-[#1a2333] border-slate-800 text-slate-300'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <span className="font-bold">#{tr.testIndex}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                              tr.isSample
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {tr.isSample ? 'Mẫu' : 'Ẩn'}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              isTestAC ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tr.verdict}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Test Detail */}
                  {(() => {
                    const curTest =
                      selectedSubmission.testResults[activeModalTestIdx] ||
                      selectedSubmission.testResults[0];
                    if (!curTest) return null;
                    const isCurAC = curTest.verdict === 'AC';
                    const vCfg = VERDICT_CONFIG[curTest.verdict as Verdict] || VERDICT_CONFIG.WA;

                    return (
                      <div className="bg-[#131924] border border-slate-800 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white">
                              Testcase #{curTest.testIndex}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                curTest.isSample
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {curTest.isSample ? 'Test Mẫu (Sample)' : '🔓 Test Ẩn (Hidden Test)'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${vCfg.badge}`}
                            >
                              {curTest.verdict}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                            <div>
                              Thời gian:{' '}
                              <span className="text-slate-200">
                                {curTest.time !== undefined
                                  ? `${(curTest.time * 1000).toFixed(0)} ms`
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              Bộ nhớ:{' '}
                              <span className="text-slate-200">
                                {curTest.memory !== undefined ? `${curTest.memory} KB` : '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Test Data */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-2.5 flex flex-col">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                                Dữ liệu vào (Input):
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(curTest.input || '');
                                  setCopiedInput(true);
                                  setTimeout(() => setCopiedInput(false), 1500);
                                }}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono"
                              >
                                {copiedInput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedInput ? 'Đã chép' : 'Chép'}</span>
                              </button>
                            </div>
                            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap break-all max-h-36 overflow-y-auto">
                              {curTest.input !== undefined && curTest.input !== ''
                                ? curTest.input
                                : '(Testcase không có input)'}
                            </pre>
                          </div>

                          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-2.5 flex flex-col">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                                Đáp án chuẩn (Expected):
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(curTest.expectedOutput || '');
                                  setCopiedExpected(true);
                                  setTimeout(() => setCopiedExpected(false), 1500);
                                }}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-mono"
                              >
                                {copiedExpected ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedExpected ? 'Đã chép' : 'Chép'}</span>
                              </button>
                            </div>
                            <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all max-h-36 overflow-y-auto">
                              {curTest.expectedOutput !== undefined &&
                              curTest.expectedOutput !== ''
                                ? curTest.expectedOutput
                                : '(Không có expected output)'}
                            </pre>
                          </div>
                        </div>

                        {/* User Output */}
                        <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                              Output của code (Stdout):
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                isCurAC ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isCurAC ? 'Khớp đáp án ✓' : 'Khác đáp án chuẩn ✗'}
                            </span>
                          </div>
                          <pre
                            className={`font-mono text-xs whitespace-pre-wrap break-all max-h-36 overflow-y-auto ${
                              isCurAC ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {curTest.stdout !== undefined && curTest.stdout !== ''
                              ? curTest.stdout
                              : '(Không có stdout)'}
                          </pre>
                        </div>

                        {/* Error if any */}
                        {curTest.error && (
                          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-rose-300 text-xs">
                            <span className="font-bold block mb-1 font-mono text-rose-400 text-[11px]">
                              Lỗi runtime / Stderr:
                            </span>
                            <pre className="whitespace-pre-wrap font-mono text-[11px]">
                              {curTest.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Source code viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Mã nguồn đã nộp:</span>
                  <button
                    onClick={() => handleCopyCode(selectedSubmission.code)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#0b0e14] border border-slate-800 p-4 rounded-xl text-slate-200 font-mono text-xs overflow-x-auto max-h-72">
                  <code>{selectedSubmission.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
