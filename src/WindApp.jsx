import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings2, 
  Calendar, 
  Clock, 
  Map as MapIcon, 
  Wind, 
  Thermometer, 
  Layers,
  Info,
  Github
} from 'lucide-react';
import WindFieldVisualization from './WindFieldVisualization';
import './App.css';

// 获取昨日 UTC 日期（格式：YYYYMMDD）
const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 将 YYYYMMDD 格式转换为 YYYY-MM-DD
const formatDateForInput = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return '';
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
};

// 将 YYYY-MM-DD 格式转换为 YYYYMMDD
const formatDateFromInput = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
};

const WindApp = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    heatmapPreset: 'normal',
    particleDensity: 128,
    particleSpeed: 2.5,
    particleSize: 3,
    batch: '18z',
    mapLayer: 'openstreet',
    date: getYesterdayDate()
  });

  const [tempSettings, setTempSettings] = useState(settings);
  const [visualizationKey, setVisualizationKey] = useState(0);
  const visualizationRef = useRef(null);

  // 处理 batch 改变
  const handleBatchChange = (newBatch) => {
    const newSettings = {...settings, batch: newBatch};
    setSettings(newSettings);
    setTempSettings({...tempSettings, batch: newBatch});
    setVisualizationKey(prev => prev + 1);
  };

  // 处理日期改变
  const handleDateConfirm = () => {
    const dateStr = tempSettings.date;
    setSettings({...settings, date: dateStr});
    setVisualizationKey(prev => prev + 1);
  };

  // 滑块改变
  const handleSliderChange = (key) => {
    const newSettings = {...settings, [key]: tempSettings[key]};
    setSettings(newSettings);
  };

  // 获取最大日期
  const getMaxDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F9FC] overflow-hidden relative font-sans text-slate-700">
      
      {/* --- 背景动效 (与 LandingPage 保持一致但更淡) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* --- 左侧：风场可视化区域 --- */}
      <div className="flex-1 h-full p-4 pl-4 pr-0 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/5 border border-white/60 bg-white relative group"
        >
          {/* 返回按钮 (悬浮在地图左上角) */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-white/50 text-slate-600 font-medium shadow-lg shadow-slate-200/50 hover:bg-white hover:text-blue-600 hover:scale-105 transition-all group-hover:translate-y-0 translate-y-[-100px] opacity-0 group-hover:opacity-100 duration-300"
            style={{ transform: 'none', opacity: 1 }} // 暂时强制显示，或者只在 hover 时显示
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back Home</span>
          </button>

          {/* 可视化组件 */}
          <div ref={visualizationRef} className="w-full h-full">
            <WindFieldVisualization key={visualizationKey} settings={settings} />
          </div>
        </motion.div>
      </div>

      {/* --- 右侧：设置面板 --- */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-96 h-full p-4 z-20 flex flex-col"
      >
        <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-2xl shadow-blue-900/5 overflow-hidden">
          
          {/* 面板头部 */}
          <div className="p-6 pb-4 border-b border-slate-200/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">控制台</h2>
                <p className="text-xs text-slate-500 font-medium">Visualization Settings</p>
              </div>
            </div>
          </div>

          {/* 可滚动内容区 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* 数据源设置 */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Calendar className="w-4 h-4" /> 数据源
              </h3>
              
              <div className="space-y-4">
                {/* 日期选择 */}
                <div className="group bg-white/50 hover:bg-white/80 transition-colors rounded-2xl p-1 border border-white/60 shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="date"
                      value={formatDateForInput(tempSettings.date)}
                      max={getMaxDate()}
                      onChange={(e) => {
                        const newDate = formatDateFromInput(e.target.value);
                        setTempSettings({...tempSettings, date: newDate});
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && tempSettings.date !== settings.date && handleDateConfirm()}
                      className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none"
                    />
                    <button
                      onClick={handleDateConfirm}
                      disabled={tempSettings.date === settings.date}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tempSettings.date !== settings.date
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 hover:bg-blue-600'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* 批次选择 */}
                <div className="grid grid-cols-4 gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                  {['00z', '06z', '12z', '18z'].map((batch) => (
                    <button
                      key={batch}
                      onClick={() => handleBatchChange(batch)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        settings.batch === batch
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      {batch}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 地图图层 */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Layers className="w-4 h-4" /> 地图图层
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'openstreet', label: 'OpenStreetMap', desc: '标准街道地图' },
                  { id: 'topo', label: 'OpenTopoMap', desc: '地形渲染图' },
                  { id: 'none', label: 'No Layer', desc: '纯白背景' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setSettings({...settings, mapLayer: layer.id})}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      settings.mapLayer === layer.id
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white/40 border-transparent hover:bg-white/60'
                    }`}
                  >
                    <div>
                      <div className={`text-sm font-bold ${settings.mapLayer === layer.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {layer.label}
                      </div>
                      <div className="text-xs text-slate-400">{layer.desc}</div>
                    </div>
                    {settings.mapLayer === layer.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 粒子效果 */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Wind className="w-4 h-4" /> 粒子引擎
              </h3>
              
              <div className="space-y-6 p-4 bg-white/40 rounded-2xl border border-white/50">
                {/* Density */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">粒子密度</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{tempSettings.particleDensity}</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="256"
                    step="8"
                    value={tempSettings.particleDensity}
                    onChange={(e) => setTempSettings({...tempSettings, particleDensity: parseInt(e.target.value)})}
                    onMouseUp={() => handleSliderChange('particleDensity')}
                    onTouchEnd={() => handleSliderChange('particleDensity')}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600"
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">流动速度</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{tempSettings.particleSpeed.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={tempSettings.particleSpeed}
                    onChange={(e) => setTempSettings({...tempSettings, particleSpeed: parseFloat(e.target.value)})}
                    onMouseUp={() => handleSliderChange('particleSpeed')}
                    onTouchEnd={() => handleSliderChange('particleSpeed')}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600"
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">粒子大小</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{tempSettings.particleSize.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.1"
                    value={tempSettings.particleSize}
                    onChange={(e) => setTempSettings({...tempSettings, particleSize: parseFloat(e.target.value)})}
                    onMouseUp={() => handleSliderChange('particleSize')}
                    onTouchEnd={() => handleSliderChange('particleSize')}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600"
                  />
                </div>
              </div>
            </section>

            {/* 热力图设置 */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Thermometer className="w-4 h-4" /> 热力图模式
              </h3>
              <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                {[
                  { id: 'normal', label: '标准' },
                  { id: 'high-transparent', label: '通透' },
                  { id: 'precise', label: '精确' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSettings({...settings, heatmapPreset: mode.id})}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      settings.heatmapPreset === mode.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* 底部关于信息 */}
          <div className="p-4 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-500 leading-relaxed">
                <p className="font-medium text-slate-700 mb-1">关于 Windel</p>
                <p>基于 ECharts FlowGL 渲染引擎</p>
                <p>数据源: ECMWF GRIB2</p>
                <a 
                  href="https://github.com/lxbme/Griber" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mt-2 font-medium"
                >
                  <Github className="w-3 h-3" /> 后端 Griber
                </a>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default WindApp;
