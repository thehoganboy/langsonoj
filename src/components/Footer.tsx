'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Code2, Shield } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Ẩn footer khi đang trong trang giải bài (split-screen IDE) để giao diện chiếm trọn 100% viewport như LeetCode
  if (pathname && pathname.startsWith('/problems/') && pathname !== '/problems') {
    return null;
  }

  return (
    <footer className="border-t border-slate-800/80 bg-[#07090e] text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  LANG SON OJ
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nền tảng Chấm bài Trực tuyến Tinh gọn & Hiện đại dành cho Competitive Programming
              </p>
            </div>
          </div>

          {/* Developer Credit Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 shadow-md shadow-blue-900/20">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium text-[11px]">Designed & Developed by</span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-mono text-[11px]">
              NgHuyHoang
            </span>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center space-x-5 text-slate-400">
            <Link href="/problems" className="hover:text-blue-400 transition-colors">
              Kho Bài Tập
            </Link>
            <Link href="/submissions" className="hover:text-blue-400 transition-colors">
              Lịch Sử Chấm
            </Link>
            <Link href="/admin" className="hover:text-amber-400 transition-colors flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Quản Trị</span>
            </Link>
            <a
              href="/HUONG_DAN_SU_DUNG_LANG_SON_OJ.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              HDSD (PDF)
            </a>
          </div>
        </div>

        {/* Bottom Credits & Tech badges */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1">
            <span>© {new Date().getFullYear()}</span>
            <strong className="text-slate-300">LANG SON OJ</strong>
            <span>• All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500">
            <span>Next.js 14</span>
            <span>•</span>
            <span>CodeMirror 6</span>
            <span>•</span>
            <span>Piston API</span>
            <span>•</span>
            <span>KaTeX Math</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
