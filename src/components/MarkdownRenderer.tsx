'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Tự động làm sạch các ký tự escape markdown (ví dụ \$N$ -> $N$) để KaTeX không nuốt text
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';
    return content
      .replaceAll('\\$', '$')
      .replaceAll('\\*', '*')
      .replaceAll('\\-', '-')
      .replaceAll('\\[', '[')
      .replaceAll('\\]', ']')
      .replaceAll('\\=', '=')
      .replaceAll('\\_', '_')
      .replaceAll('\\`', '`')
      .replaceAll('\\#', '#')
      .replaceAll('\\\\le', '\\le')
      .replaceAll('\\\\ge', '\\ge')
      .replaceAll('\\\\ne', '\\ne');
  }, [content]);

  return (
    <div className={`prose prose-invert max-w-none text-slate-300 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800/60" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-blue-400 mt-4 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="text-slate-300 leading-relaxed mb-3 text-sm" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 text-sm space-y-1 text-slate-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 text-sm space-y-1 text-slate-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-slate-800/80 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700/50" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-[#0f141c] p-3 rounded-lg border border-slate-800 text-slate-200 text-xs font-mono my-2 overflow-x-auto">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-3 italic text-slate-400 my-2 text-sm bg-blue-500/5 py-1 rounded-r" {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="bg-slate-800/60 p-2 font-medium text-slate-200 border-b border-slate-800" {...props} />,
          td: ({ node, ...props }) => <td className="p-2 border-b border-slate-800/50 text-slate-300" {...props} />,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
