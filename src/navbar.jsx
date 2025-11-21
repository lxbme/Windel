import React from 'react';
import { Wind, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Navbar 导航栏组件
 * @param {Object} props
 * @param {Array} props.pages - 页面列表，格式：[{ name: '首页', url: '/' }, ...]
 * @param {string} props.githubUrl - GitHub 仓库链接
 */
const Navbar = ({ pages = [], githubUrl = '' }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-2 bg-white/30 backdrop-blur-md border-b border-white/40 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1920px] mx-auto">
        
        {/* 左侧：Logo + Title + 页面按钮 */}
        <div className="flex items-center gap-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <Wind className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              Windel
            </span>
          </div>

          {/* 分隔线 */}
          <div className="h-4 w-px bg-slate-300/50 mx-1" />

          {/* 页面按钮 */}
          <div className="flex items-center gap-1">
            {pages.map((page, index) => (
              <Link
                key={index}
                to={page.url}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white/60 transition-all duration-200"
              >
                {page.name}
              </Link>
            ))}
          </div>
        </div>

        {/* 右侧：GitHub 链接 */}
        {githubUrl && (
          <a 
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white border border-white/40 text-slate-600 font-medium text-xs shadow-sm hover:shadow hover:text-blue-600 transition-all duration-200 group"
          >
            <Github className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

