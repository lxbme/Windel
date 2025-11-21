import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Wind } from 'lucide-react';
import Navbar from './navbar';
import WindSpeedHeatmap from './WindSpeedHeatmap';
import ProvinceWindRanking from './ProvinceWindRanking';
import MonthlyTyphoonActivity from './MonthlyTyphoonActivity';

const StatsPage = () => {
  // 导航栏页面列表
  const navPages = [
    { name: '首页', url: '/' },
    { name: '风场可视化', url: '/app' },
    { name: '数据统计', url: '/stats' },
  ];

  return (
    <div className="h-screen w-full bg-[#F5F9FC] relative font-sans text-slate-700 overflow-hidden">
      
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

      {/* 主内容区域 - 可滚动容器 */}
      <div className="relative z-10 h-full pt-14 overflow-y-auto custom-scrollbar">
        <div className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            
            {/* 页面标题 */}
            {/* <motion.div
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
            </motion.div> */}

            {/* 占位卡片网格 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 省会城市风速排名 - 占两列 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="md:col-span-2 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">本周省会城市风速排名</h3>
                    {/* <p className="text-xs text-slate-500">各省会城市平均风速对比</p> */}
                  </div>
                </div>
                <ProvinceWindRanking />
              </motion.div>

              {/* 本月台风活动 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Wind className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">本月台风活动</h3>
                    {/* <p className="text-xs text-slate-500">当月活跃台风统计</p> */}
                  </div>
                </div>
                <MonthlyTyphoonActivity />
              </motion.div>

              {/* 风速热力图 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5"
              >
                {/* <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Wind className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">风速年度热力图</h3>
                    <p className="text-xs text-slate-500">2025年成都地区风速分布日历</p>
                  </div>
                </div> */}
                <WindSpeedHeatmap />
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

