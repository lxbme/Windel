import React from 'react';
import { motion } from 'framer-motion';
import { Wind, Navigation, Layers, Github, ArrowRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F9FC] text-slate-800 font-sans selection:bg-cyan-200 overflow-x-hidden relative">
      
      {/* --- 背景动效层 (Liquid Background) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 蓝色流体球 */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse mix-blend-multiply" />
        {/* 青色流体球 */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[100px] animate-pulse mix-blend-multiply" style={{ animationDuration: '4s' }} />
        {/* 紫色点缀球 */}
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-300/20 rounded-full blur-[80px]" />
      </div>

      {/* --- 导航栏 (Glass Navbar) --- */}
      <nav className="relative z-50 w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Wind className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Windel
            </span>
          </div>
          
          <div className="flex gap-4">
            <a 
              href="https://github.com/lxbme/Windel" 
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-slate-700 font-medium hover:bg-white/60 transition-all hover:shadow-lg hover:scale-105"
            >
              <Github className="w-4 h-4" />
              <span>Star on GitHub</span>
            </a>
            <button 
              onClick={() => navigate('/app')}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:scale-105 flex items-center gap-2"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-32 flex flex-col items-center text-center">
        
        {/* 徽章 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Weather Data by ECMWF
        </motion.div>

        {/* 主标题 */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]"
        >
          看见大气的 <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 drop-shadow-sm">
            每一次脉动
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed"
        >
          基于 Vite 与 Echarts 构建的下一代风场可视化引擎。<br/>
          追踪台风轨迹，洞察全球气流，轻量、极速、精准。
        </motion.p>

        {/* --- 核心展示区 (Liquid Glass Card) --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative w-full max-w-5xl aspect-video rounded-[2rem] p-2 md:p-4"
        >
          {/* 玻璃外壳光效 */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/60 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-900/10" />
          
          {/* 模拟应用界面内容 */}
          <div className="relative h-full w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-inner group">
            {/* 这里放置你的项目截图，目前用CSS模拟风场 */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"></div>
            
            {/* 模拟风粒子流动的遮罩层 */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
            
            {/* UI Floating Elements */}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="px-4 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white text-sm font-medium">
                Wind Speed: 45km/h
              </div>
              <div className="px-4 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 Typhoon In-Fa
              </div>
            </div>
            
            {/* 模拟 Echarts 控件 */}
            <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs">
              Powered by Echarts & ECMWF
            </div>
          </div>
        </motion.div>
      </main>

      {/* --- 特性网格 (Bento Grid Style) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-cyan-900/5 hover:bg-white/60 transition-colors group">
            <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">全球流场可视化</h3>
            <p className="text-slate-500 leading-relaxed">
              利用 Echarts 强大的粒子渲染能力，实时呈现来自 ECMWF 的全球风场、气压与温度数据。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-900/5 hover:bg-white/60 transition-colors group">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Navigation className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">台风轨迹追踪</h3>
            <p className="text-slate-500 leading-relaxed">
              集成 IBTrACS 数据源,精准回溯历史台风路径，并对当前活跃台风进行实时定位与预测。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-indigo-900/5 hover:bg-white/60 transition-colors group">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layers className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">现代技术栈</h3>
            <p className="text-slate-500 leading-relaxed">
              基于 React + Vite 构建，配合 Echarts GL，带来如丝般顺滑的交互体验与毫秒级加载速度。
            </p>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-slate-400 text-sm">
        <p>© 2024 Windel Project. Designed by lxbme.</p>
      </footer>

    </div>
  );
};

export default LandingPage;

