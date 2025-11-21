import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import Navbar from './navbar';

const StatsPage = () => {
  // 导航栏页面列表
  const navPages = [
    { name: '首页', url: '/' },
    { name: '风场可视化', url: '/app' },
    { name: '数据统计', url: '/stats' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F9FC] relative font-sans text-slate-700">
      
      {/* 导航栏 */}
      <Navbar 
        pages={navPages}
        githubUrl="https://github.com/lxbme/Windel"
      />
      
      {/* --- 背景动效 --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800">数据统计</h1>
                <p className="text-slate-500 mt-1">气象数据分析与可视化</p>
              </div>
            </div>
          </motion.div>

          {/* 占位卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 占位卡片 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">趋势分析</h3>
              </div>
              <div className="h-40 flex items-center justify-center bg-slate-100/50 rounded-xl border border-slate-200/50">
                <p className="text-slate-400 text-sm">图表区域 - 开发中</p>
              </div>
            </motion.div>

            {/* 占位卡片 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">实时监控</h3>
              </div>
              <div className="h-40 flex items-center justify-center bg-slate-100/50 rounded-xl border border-slate-200/50">
                <p className="text-slate-400 text-sm">图表区域 - 开发中</p>
              </div>
            </motion.div>

            {/* 占位卡片 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">数据对比</h3>
              </div>
              <div className="h-40 flex items-center justify-center bg-slate-100/50 rounded-xl border border-slate-200/50">
                <p className="text-slate-400 text-sm">图表区域 - 开发中</p>
              </div>
            </motion.div>

            {/* 更多占位卡片可以在这里添加 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="md:col-span-2 lg:col-span-3 p-8 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">更多统计图表即将上线</h3>
                <p className="text-slate-500">包括风速分布、温度变化、气压趋势等多维度数据分析</p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

