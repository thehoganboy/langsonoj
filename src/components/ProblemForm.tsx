'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  parseProblemTxt,
  ParsedProblemData,
  SAMPLE_TXT_CONTENT,
  GUILD_TXT_CONTENT,
} from '@/lib/problemParser';
import { parseTestcasesFromZip } from '@/lib/zipTestcasesParser';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  Eye,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  FileUp,
  Edit3,
  Download,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  X,
  FileCode,
  BookOpen,
  Archive,
  FolderArchive,
  Loader2,
} from 'lucide-react';

interface TestcaseItem {
  id?: string;
  input: string;
  output: string;
  isSample: boolean;
  explanation?: string;
}

interface ProblemFormProps {
  initialData?: {
    id?: string;
    slug: string;
    title: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    description: string;
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    tags?: string;
    testcases?: TestcaseItem[];
  };
  isEdit?: boolean;
}

export default function ProblemForm({ initialData, isEdit = false }: ProblemFormProps) {
  const router = useRouter();

  // Mode selection: 'manual' (nhập thủ công) vs 'file' (nhập từ file mẫu)
  const [creationMode, setCreationMode] = useState<'manual' | 'file'>('manual');

  // Form states
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'EASY');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 1000);
  const [memoryLimit, setMemoryLimit] = useState(initialData?.memoryLimit || 262144);
  const [tags, setTags] = useState(initialData?.tags || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [inputFormat, setInputFormat] = useState(initialData?.inputFormat || '');
  const [outputFormat, setOutputFormat] = useState(initialData?.outputFormat || '');
  const [constraints, setConstraints] = useState(initialData?.constraints || '');

  // Markdown preview tab
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  // Testcases state
  const [testcases, setTestcases] = useState<TestcaseItem[]>(
    initialData?.testcases || [
      {
        input: '',
        output: '',
        isSample: true,
        explanation: '',
      },
    ]
  );

  // File import states
  const [txtContent, setTxtContent] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<ParsedProblemData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateTab, setTemplateTab] = useState<'sample' | 'guild'>('sample');
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ZIP testcases import states
  const [zipLoading, setZipLoading] = useState(false);
  const [zipSuccessMsg, setZipSuccessMsg] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipAppendMode, setZipAppendMode] = useState(false);

  // Add testcase
  const addTestcase = (isSample = false) => {
    setTestcases((prev) => [
      ...prev,
      {
        input: '',
        output: '',
        isSample,
        explanation: '',
      },
    ]);
  };

  // Remove testcase
  const removeTestcase = (index: number) => {
    if (testcases.length <= 1) {
      alert('Bài tập cần có ít nhất 1 testcase!');
      return;
    }
    setTestcases((prev) => prev.filter((_, i) => i !== index));
  };

  // Update testcase field
  const updateTestcase = (index: number, field: keyof TestcaseItem, value: any) => {
    setTestcases((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle single testcase file upload (.in or .out)
  const handleSingleTestCaseFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: 'input' | 'output'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        updateTestcase(index, field, content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle bulk problem txt file upload
  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        processTxtContent(content);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Handle bulk ZIP testcases upload
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setZipLoading(true);
      setZipError(null);
      setZipSuccessMsg(null);

      const result = await parseTestcasesFromZip(file);
      if (!result.success || result.testcases.length === 0) {
        setZipError(result.error || 'Không tìm thấy testcase hợp lệ trong file ZIP!');
        return;
      }

      if (zipAppendMode) {
        setTestcases((prev) => [...prev, ...result.testcases]);
        setZipSuccessMsg(
          `Đã nối thêm ${result.testcases.length} testcases từ file ZIP (${result.detectedFormat})!`
        );
      } else {
        setTestcases(result.testcases);
        setZipSuccessMsg(
          `Đã nạp thành công ${result.testcases.length} testcases từ file ZIP (${result.detectedFormat})!`
        );
      }
    } catch (err: any) {
      setZipError(`Lỗi khi đọc file ZIP: ${err.message || 'Không thể giải nén'}`);
    } finally {
      setZipLoading(false);
      e.target.value = '';
    }
  };

  // Process and parse text content from sample.txt
  const processTxtContent = (content: string) => {
    setTxtContent(content);
    const result = parseProblemTxt(content);
    if (!result.success || !result.data) {
      setParseError(result.error || 'Cấu trúc file không đúng định dạng!');
      setParsedPreview(null);
      return;
    }

    setParseError(null);
    const data = result.data;
    setParsedPreview(data);

    // Tự động điền (auto-fill) toàn bộ vào form
    setTitle(data.title);
    setSlug(data.slug);
    setDifficulty(data.difficulty);
    setTimeLimit(data.timeLimit);
    setMemoryLimit(data.memoryLimit);
    setTags(data.tags);
    setDescription(data.description);
    setInputFormat(data.inputFormat);
    setOutputFormat(data.outputFormat);
    setConstraints(data.constraints);
    setTestcases(data.testcases);
  };

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!slug.trim() || !title.trim() || !description.trim()) {
      setError('Vui lòng điền đầy đủ Mã bài (Slug), Tên bài và Đề bài Markdown!');
      return;
    }

    if (testcases.length === 0) {
      setError('Cần ít nhất 1 testcase để chấm bài!');
      return;
    }

    try {
      setSaving(true);
      const url = isEdit && initialData?.id
        ? `/api/admin/problems/${initialData.id}`
        : '/api/admin/problems';

      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        slug: slug.trim().toLowerCase(),
        title: title.trim(),
        difficulty,
        timeLimit: Number(timeLimit),
        memoryLimit: Number(memoryLimit),
        tags: tags.trim(),
        description: description.trim(),
        inputFormat: inputFormat.trim(),
        outputFormat: outputFormat.trim(),
        constraints: constraints.trim(),
        testcases,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu bài tập');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang quản trị</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isEdit ? 'Lưu cập nhật bài tập' : 'Xuất bản bài tập mới'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= 2 LỰA CHỌN TẠO BÀI (MANUAL VS FILE) ================= */}
      {!isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#0e131d] border border-slate-800 rounded-2xl">
          {/* Lựa chọn 1: Nhập thủ công */}
          <button
            type="button"
            onClick={() => setCreationMode('manual')}
            className={`p-4 rounded-xl text-left transition-all flex items-start space-x-3.5 ${
              creationMode === 'manual'
                ? 'bg-blue-600/15 border border-blue-500/60 shadow-lg shadow-blue-600/10'
                : 'hover:bg-slate-800/40 border border-transparent text-slate-400'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                creationMode === 'manual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold ${
                    creationMode === 'manual' ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  1. Nhập thủ công
                </span>
                {creationMode === 'manual' && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                    Đang chọn
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Tự tay điền thông tin, soạn đề bài hỗ trợ KaTeX toán học và cấu hình từng testcase trên giao diện web.
              </p>
            </div>
          </button>

          {/* Lựa chọn 2: Nhập từ file mẫu */}
          <button
            type="button"
            onClick={() => setCreationMode('file')}
            className={`p-4 rounded-xl text-left transition-all flex items-start space-x-3.5 ${
              creationMode === 'file'
                ? 'bg-cyan-600/15 border border-cyan-500/60 shadow-lg shadow-cyan-600/10'
                : 'hover:bg-slate-800/40 border border-transparent text-slate-400'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                creationMode === 'file'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold ${
                    creationMode === 'file' ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  2. Nhập từ file mẫu (.txt)
                </span>
                {creationMode === 'file' && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono">
                    Đang chọn
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Nạp file <strong className="text-cyan-300 font-mono">sample.txt</strong> chứa đầy đủ đề bài và testcases. Hệ thống tự động phân tích và điền toàn bộ trong 1 giây.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ================= SECTION: IMPORT TỪ FILE MẪU ================= */}
      {creationMode === 'file' && !isEdit && (
        <div className="bg-[#0f141d] border border-cyan-500/40 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Header & Download Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Tải lên File Mẫu Bài Tập (.txt)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tải file mẫu về máy, điền đề bài và bộ test theo mẫu rồi nạp lại vào đây.
              </p>
            </div>

            {/* Download Buttons & Preview button */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/sample.txt"
                download="sample.txt"
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu (sample.txt)</span>
              </a>

              <a
                href="/guild.txt"
                download="guild.txt"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tải hướng dẫn (guild.txt)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem nội dung mẫu</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Chọn file từ máy tính */}
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[#131924]/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                <FileUp className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                Chọn file bài tập (.txt) từ máy tính
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                Hỗ trợ file đề <code className="text-cyan-300">.txt</code> (thẻ <code className="text-cyan-300">=== SECTION ===</code>) hoặc nén bộ test <code className="text-indigo-300">.zip</code>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-600/20 transition-all flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp file đề .txt</span>
                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={handleTxtFileUpload}
                  />
                </label>

                <label className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span>Nạp bộ test .zip</span>
                  <input
                    type="file"
                    accept=".zip"
                    disabled={zipLoading}
                    className="hidden"
                    onChange={handleZipUpload}
                  />
                </label>
              </div>
            </div>

            {/* Cột 2: Dán nội dung trực tiếp */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Hoặc dán nội dung file mẫu vào đây:
                </span>
                {txtContent && (
                  <button
                    type="button"
                    onClick={() => {
                      setTxtContent('');
                      setParsedPreview(null);
                      setParseError(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Xóa trắng
                  </button>
                )}
              </div>
              <textarea
                value={txtContent}
                onChange={(e) => processTxtContent(e.target.value)}
                rows={7}
                placeholder="Dán toàn bộ nội dung từ file sample.txt vào đây... Hệ thống sẽ tự động bóc tách đề bài và các bộ test ngay lập tức."
                className="w-full flex-1 bg-[#131924] border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Lỗi phân tích nếu có */}
          {parseError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Kết quả phân tích thành công (Live Preview Summary) */}
          {parsedPreview && (
            <div className="bg-[#121927] border border-emerald-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Đã bóc tách thành công thông tin bài tập & Testcases!
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {parsedPreview.testcases.length} testcases
                </span>
              </div>

              {/* Thông số tóm tắt */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#0b0e14] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Tên bài:</span>
                  <span className="font-bold text-white font-sans text-xs line-clamp-1">
                    {parsedPreview.title}
                  </span>
                </div>
                <div className="bg-[#0b0e14] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Mã bài (Slug):</span>
                  <span className="text-cyan-400">{parsedPreview.slug}</span>
                </div>
                <div className="bg-[#0b0e14] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Độ khó:</span>
                  <span className="text-amber-400 font-bold">{parsedPreview.difficulty}</span>
                </div>
                <div className="bg-[#0b0e14] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Bộ test:</span>
                  <span className="text-purple-300">
                    {parsedPreview.testcases.filter((t) => t.isSample).length} mẫu,{' '}
                    {parsedPreview.testcases.filter((t) => !t.isSample).length} ẩn
                  </span>
                </div>
              </div>

              {/* Action buttons after parsing */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Toàn bộ thông tin và các bộ test đã được tự động điền vào hệ thống.
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreationMode('manual')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Xem & Chỉnh sửa trên Form</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Xuất bản bài tập ngay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION: FORM NHẬP THỦ CÔNG (TRUYỀN THỐNG) ================= */}
      {(creationMode === 'manual' || isEdit) && (
        <div className="space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-2 flex items-center justify-between">
              <span>1. Thông tin cơ bản bài tập</span>
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setCreationMode('file')}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 font-normal font-sans"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Hoặc nạp nhanh từ file sample.txt</span>
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên bài tập <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tổng Hai Số (Two Sum)"
                  required
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mã bài / Slug <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="VD: two-sum (chỉ chữ thường, số và gạch ngang)"
                  required
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Độ khó</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="EASY">Dễ (Easy)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HARD">Khó (Hard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Giới hạn thời gian (ms)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Giới hạn bộ nhớ (KB)
                </label>
                <input
                  type="number"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(Number(e.target.value))}
                  placeholder="262144 (256MB)"
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tags / Chủ đề
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Math, DP, Array..."
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Đề bài & Markdown Editor với Live Preview */}
          <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-sm font-bold text-white">
                2. Đề bài & Quy cách I/O (Hỗ trợ Markdown + LaTeX KaTeX)
              </h3>
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(false)}
                  className={`px-3 py-1 rounded transition-colors ${
                    !previewMarkdown
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Soạn thảo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(true)}
                  className={`px-3 py-1 rounded flex items-center space-x-1 transition-colors ${
                    previewMarkdown
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước KaTeX</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nội dung đề bài chi tiết (Markdown) <span className="text-rose-400">*</span>
              </label>
              {previewMarkdown ? (
                <div className="bg-[#121824] border border-slate-700 rounded-lg p-4 min-h-[220px]">
                  <MarkdownRenderer content={description || '*Chưa có nội dung đề bài*'} />
                </div>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  placeholder="Nhập mô tả đề bài... Bạn có thể dùng $a + b$ hoặc $$F_n = F_{n-1} + F_{n-2}$$ để gõ công thức toán học KaTeX."
                  required
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Định dạng Input (Input Format)
                </label>
                <textarea
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  rows={3}
                  placeholder="VD: Dòng đầu chứa số nguyên n..."
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Định dạng Output (Output Format)
                </label>
                <textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  rows={3}
                  placeholder="VD: In ra một số nguyên duy nhất là kết quả..."
                  className="w-full bg-[#151c27] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ràng buộc dữ liệu (Constraints)
              </label>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="VD: $1 \le n \le 10^5$, $|a_i| \le 10^9$"
                className="w-full bg-[#151c27] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Quản lý Testcases */}
          <div className="bg-[#0f141d] border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  3. Bộ Testcases Chấm Điểm ({testcases.length} tests)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đánh dấu "Sample Test" để hiển thị trong đề bài. Các test không đánh dấu sẽ là "Hidden Test" bí mật.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => addTestcase(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Test Mẫu (Sample)</span>
                </button>
                <button
                  type="button"
                  onClick={() => addTestcase(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Test Ẩn (Hidden)</span>
                </button>
              </div>
            </div>

            {/* Hộp nạp Testcases nhanh từ File ZIP */}
            <div className="bg-[#121926]/80 border border-dashed border-cyan-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Nhập bộ Testcases từ File ZIP (.zip)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                      Khuyên dùng cho đề thi HSG
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ chuẩn Themis (thư mục <code>Test01/</code>, <code>Test02/</code>) hoặc cặp file cùng tên (<code>1.in / 1.out</code>, <code>test1.inp / test1.out</code>).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zipAppendMode}
                    onChange={(e) => setZipAppendMode(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
                  />
                  <span>Nối thêm vào danh sách</span>
                </label>

                <label className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5 shrink-0">
                  {zipLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{zipLoading ? 'Đang giải nén...' : 'Chọn file .zip'}</span>
                  <input
                    type="file"
                    accept=".zip"
                    disabled={zipLoading}
                    className="hidden"
                    onChange={handleZipUpload}
                  />
                </label>
              </div>
            </div>

            {/* Thông báo kết quả nạp ZIP */}
            {zipSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{zipSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZipSuccessMsg(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {zipError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{zipError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZipError(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* List of testcases */}
            <div className="space-y-4">
              {testcases.map((tc, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    tc.isSample
                      ? 'bg-[#121927] border-blue-500/30'
                      : 'bg-[#10141e] border-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xs text-white">
                        Test #{index + 1}
                      </span>

                      {/* Toggle Sample vs Hidden */}
                      <label className="flex items-center space-x-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={tc.isSample}
                          onChange={(e) => updateTestcase(index, 'isSample', e.target.checked)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800"
                        />
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            tc.isSample
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tc.isSample ? '★ Sample Test (Công khai)' : '🔒 Hidden Test (Chấm điểm bí mật)'}
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTestcase(index)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Xóa testcase này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Input and Output textareas + File Uploaders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-300">Input:</span>
                        <label className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                          <Upload className="w-3 h-3" />
                          <span>Nạp file .in</span>
                          <input
                            type="file"
                            accept=".in,.txt"
                            className="hidden"
                            onChange={(e) => handleSingleTestCaseFileUpload(e, index, 'input')}
                          />
                        </label>
                      </div>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestcase(index, 'input', e.target.value)}
                        rows={4}
                        placeholder="Nhập standard input cho test này..."
                        className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Output */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-300">Expected Output:</span>
                        <label className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                          <Upload className="w-3 h-3" />
                          <span>Nạp file .out</span>
                          <input
                            type="file"
                            accept=".out,.txt,.ans"
                            className="hidden"
                            onChange={(e) => handleSingleTestCaseFileUpload(e, index, 'output')}
                          />
                        </label>
                      </div>
                      <textarea
                        value={tc.output}
                        onChange={(e) => updateTestcase(index, 'output', e.target.value)}
                        rows={4}
                        placeholder="Nhập expected output chuẩn..."
                        className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sample test explanation */}
                  {tc.isSample && (
                    <div className="mt-3">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Giải thích cho ví dụ này (tùy chọn):
                      </label>
                      <input
                        type="text"
                        value={tc.explanation || ''}
                        onChange={(e) => updateTestcase(index, 'explanation', e.target.value)}
                        placeholder="VD: 3 + 5 = 8"
                        className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM NỘI DUNG SAMPLE.TXT & GUILD.TXT ================= */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10141d] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#131924]">
              <div className="flex items-center space-x-3">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Mẫu File & Hướng Dẫn Điền
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyTemplate(
                      templateTab === 'sample' ? SAMPLE_TXT_CONTENT : GUILD_TXT_CONTENT
                    )
                  }
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center border-b border-slate-800 bg-[#0c1017] px-4 pt-2">
              <button
                type="button"
                onClick={() => setTemplateTab('sample')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  templateTab === 'sample'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                sample.txt (File Mẫu)
              </button>
              <button
                type="button"
                onClick={() => setTemplateTab('guild')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  templateTab === 'guild'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                guild.txt (Hướng Dẫn Chi Tiết)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-[#090c12]">
              <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text p-2">
                {templateTab === 'sample' ? SAMPLE_TXT_CONTENT : GUILD_TXT_CONTENT}
              </pre>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
