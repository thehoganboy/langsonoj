'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Code2, Copy, Check, ZoomIn, ZoomOut, Terminal, CheckCircle2 } from 'lucide-react';

// Nạp CodeMirror client-side để tối ưu tốc độ và tương thích hoàn toàn Next.js App Router
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#141822] text-slate-400 font-mono text-xs space-y-2">
      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Đang chuẩn bị Code Editor...</span>
    </div>
  ),
});

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const [fontSize, setFontSize] = useState<number>(13);
  const [copied, setCopied] = useState(false);
  const [editorMode, setEditorMode] = useState<'codemirror' | 'simple'>('codemirror');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Xác định extension ngôn ngữ tương ứng
  const langExtension = useMemo(() => {
    switch (language.toLowerCase()) {
      case 'cpp':
      case 'c++':
      case 'c':
        return cpp();
      case 'python':
      case 'py':
        return python();
      case 'java':
        return java();
      default:
        return cpp();
    }
  }, [language]);

  // Cấu hình theme One Dark hiện đại và chuẩn Competitive Programming (không bị cắt chữ)
  const editorTheme = useMemo(() => {
    return EditorView.theme({
      '&': {
        height: '100%',
        backgroundColor: '#121620',
        fontSize: `${fontSize}px`,
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
        lineHeight: '1.65',
        paddingTop: '8px',
        paddingBottom: '24px',
      },
      '.cm-content': {
        paddingTop: '0px',
        caretColor: '#38bdf8',
      },
      '.cm-gutters': {
        backgroundColor: '#0f131a',
        color: '#64748b',
        borderRight: '1px solid #1e293b',
        paddingLeft: '6px',
        paddingRight: '6px',
        userSelect: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#1e293b',
        color: '#38bdf8',
        fontWeight: 'bold',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
      },
      '.cm-cursor': {
        borderLeftColor: '#38bdf8',
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: '#1d4ed8 !important',
      },
    });
  }, [fontSize]);

  const extensions = useMemo(() => {
    return [langExtension, editorTheme];
  }, [langExtension, editorTheme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleZoom = (delta: number) => {
    setFontSize((prev) => Math.min(20, Math.max(11, prev + delta)));
  };

  // Fallback simple textarea (nếu người dùng muốn chuyển đổi)
  const lineCount = Math.max(value.split('\n').length, 15);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleSimpleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#121620] relative select-text overflow-hidden">
      {/* Editor Sub-Header Toolbar */}
      <div className="h-8 bg-[#0f131a] border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center space-x-2 text-slate-300">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200 uppercase">{language}</span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center space-x-1 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sẵn sàng nhập code</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom In/Out */}
          <div className="flex items-center bg-[#1a2130] rounded border border-slate-800 px-1 py-0.5 space-x-0.5">
            <button
              type="button"
              onClick={() => handleZoom(-1)}
              className="px-1 text-slate-400 hover:text-white transition-colors title='Giảm cỡ chữ'"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-slate-400 px-1 font-mono">{fontSize}px</span>
            <button
              type="button"
              onClick={() => handleZoom(1)}
              className="px-1 text-slate-400 hover:text-white transition-colors title='Tăng cỡ chữ'"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors flex items-center space-x-1"
            title="Sao chép toàn bộ code"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>

          {/* Toggle Engine */}
          <div className="flex items-center bg-[#1a2130] rounded border border-slate-800 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setEditorMode('codemirror')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                editorMode === 'codemirror'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CodeMirror
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('simple')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                editorMode === 'simple'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Textarea
            </button>
          </div>
        </div>
      </div>

      {/* Main Coding Canvas */}
      <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        {editorMode === 'codemirror' ? (
          mounted ? (
            <CodeMirror
              value={value}
              height="100%"
              theme={oneDark}
              extensions={extensions}
              onChange={(val) => onChange(val)}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
              indentWithTab={true}
              className="h-full w-full text-slate-100"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#121620] text-slate-400 font-mono text-xs">
              Đang khởi tạo trình soạn thảo...
            </div>
          )
        ) : (
          /* Robust Fallback Textarea (căn chỉnh hoàn hảo, không bị cắt dòng) */
          <div className="h-full w-full flex bg-[#121620] text-slate-100 font-mono text-xs overflow-hidden">
            <div className="w-12 bg-[#0f131a] text-slate-500 pt-3 pb-3 pr-2.5 text-right select-none font-mono text-[12px] leading-[22px] overflow-hidden border-r border-slate-800">
              {lineNumbers.map((num) => (
                <div key={num} className="h-[22px]">
                  {num}
                </div>
              ))}
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleSimpleKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              style={{ fontSize: `${fontSize}px`, lineHeight: '22px' }}
              className="flex-1 h-full bg-transparent pt-3 pb-3 px-3 text-slate-200 font-mono resize-none focus:outline-none border-none overflow-y-auto whitespace-pre tab-4 selection:bg-blue-600 selection:text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
