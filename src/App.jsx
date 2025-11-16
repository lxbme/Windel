import { useState, useRef, useEffect } from 'react'
import WindFieldVisualization from './WindFieldVisualization'
import './App.css'

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

// 将 YYYYMMDD 格式转换为 YYYY-MM-DD（用于 input type="date"）
const formatDateForInput = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return '';
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
};

// 将 YYYY-MM-DD 格式转换为 YYYYMMDD
const formatDateFromInput = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
};

// 热力图预设值配置
const HEATMAP_PRESETS = {
  'normal': { opacity: 0.1, blurRadius: 15, label: '普通' },
  'high-transparent': { opacity: 0.05, blurRadius: 15, label: '高透明' },
  'precise': { opacity: 1.0, blurRadius: 5, label: '精准' }
};

function App() {
  const [settings, setSettings] = useState({
    heatmapPreset: 'normal', // normal, high-transparent, precise
    particleDensity: 128,
    particleSpeed: 2.5,
    particleSize: 3,
    batch: '18z',
    mapLayer: 'openstreet', // topo, openstreet, none
    date: getYesterdayDate() // 默认昨天的日期（YYYYMMDD格式）
  });

  // 临时设置值（用于滑块拖动时的显示，不立即应用）
  const [tempSettings, setTempSettings] = useState(settings);
  
  // 组件重新渲染的 key（batch 改变时触发完整重渲染）
  const [visualizationKey, setVisualizationKey] = useState(0);

  const visualizationRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState('auto');

  // 监听可视化组件高度变化，同步到设置面板
  useEffect(() => {
    const updateHeight = () => {
      if (visualizationRef.current) {
        const height = visualizationRef.current.offsetHeight;
        setPanelHeight(`${height}px`);
      }
    };

    // 初始化高度
    updateHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', updateHeight);
    
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(updateHeight);
    if (visualizationRef.current) {
      observer.observe(visualizationRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    // 延迟更新，确保组件完全渲染
    const timeoutId = setTimeout(updateHeight, 100);
    const intervalId = setInterval(updateHeight, 1000); // 每秒检查一次

    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // 处理 batch 改变（完整重新渲染组件）
  const handleBatchChange = (newBatch) => {
    setSettings({...settings, batch: newBatch});
    setTempSettings({...tempSettings, batch: newBatch});
    setVisualizationKey(prev => prev + 1); // 强制重新渲染
  };

  // 处理日期输入框改变（只更新临时状态）
  const handleDateInputChange = (newDate) => {
    const dateStr = formatDateFromInput(newDate);
    setTempSettings({...tempSettings, date: dateStr});
  };

  // 处理日期确认（完整重新渲染组件）
  const handleDateConfirm = () => {
    const dateStr = tempSettings.date;
    setSettings({...settings, date: dateStr});
    setVisualizationKey(prev => prev + 1); // 强制重新渲染
  };

  // 获取最大可选日期（昨天）
  const getMaxDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const year = yesterday.getUTCFullYear();
    const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 处理滑块拖动结束（应用设置）
  const handleSliderChange = (key) => {
    // 从 tempSettings 中获取当前值并应用到 settings
    const newSettings = {...settings, [key]: tempSettings[key]};
    setSettings(newSettings);
  };

  return (
    <div className="app-container">
      {/* 左侧：风场可视化 */}
      <div ref={visualizationRef} className="visualization-container">
        <WindFieldVisualization key={visualizationKey} settings={settings} />
      </div>

      {/* 右侧：设置面板 */}
      <div className="settings-panel" style={{ height: panelHeight, display: 'flex', flexDirection: 'column' }}>
        {/* 可滚动的内容区域 */}
        <div className="settings-scrollable" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          paddingBottom: '20px',
          width: '100%',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          <h2>设置面板</h2>
          
          <div className="settings-section">
            <h3>热力图设置</h3>
            
            <div className="settings-item">
              <label>预设模式</label>
              <select
                value={settings.heatmapPreset}
                onChange={(e) => setSettings({...settings, heatmapPreset: e.target.value})}
              >
                <option value="normal">默认</option>
                <option value="high-transparent">高透明</option>
                <option value="precise">精准</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>数据源</h3>
            
            <div className="settings-item">
              <label>日期</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={formatDateForInput(tempSettings.date)}
                  max={getMaxDate()}
                  onChange={(e) => handleDateInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempSettings.date !== settings.date) {
                      handleDateConfirm();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleDateConfirm}
                  disabled={tempSettings.date === settings.date}
                >
                  确认
        </button>
              </div>
            </div>
            
            <div className="settings-item">
              <label>批次时间</label>
              <select
                value={settings.batch}
                onChange={(e) => handleBatchChange(e.target.value)}
              >
                <option value="00z">00:00 UTC (00z)</option>
                <option value="06z">06:00 UTC (06z)</option>
                <option value="12z">12:00 UTC (12z)</option>
                <option value="18z">18:00 UTC (18z)</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>底图设置</h3>
            
            <div className="settings-item">
              <label>底图类型</label>
              <select
                value={settings.mapLayer}
                onChange={(e) => setSettings({...settings, mapLayer: e.target.value})}
              >
                <option value="openstreet">OpenStreetMap（街道图）</option>
                <option value="topo">OpenTopoMap（地形图）</option>
                <option value="none">无底图</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>粒子效果</h3>
            
            <div className="settings-item">
              <label>
                粒子密度
                <span className="value-display">{tempSettings.particleDensity}</span>
              </label>
              <input
                type="range"
                min="32"
                max="256"
                step="8"
                value={tempSettings.particleDensity}
                onChange={(e) => setTempSettings({...tempSettings, particleDensity: parseInt(e.target.value)})}
                onMouseUp={() => handleSliderChange('particleDensity')}
                onTouchEnd={() => handleSliderChange('particleDensity')}
              />
            </div>
            
            <div className="settings-item">
              <label>
                粒子速度
                <span className="value-display">{tempSettings.particleSpeed.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={tempSettings.particleSpeed}
                onChange={(e) => setTempSettings({...tempSettings, particleSpeed: parseFloat(e.target.value)})}
                onMouseUp={() => handleSliderChange('particleSpeed')}
                onTouchEnd={() => handleSliderChange('particleSpeed')}
              />
            </div>
            
            <div className="settings-item">
              <label>
                粒子大小
                <span className="value-display">{tempSettings.particleSize.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.1"
                value={tempSettings.particleSize}
                onChange={(e) => setTempSettings({...tempSettings, particleSize: parseFloat(e.target.value)})}
                onMouseUp={() => handleSliderChange('particleSize')}
                onTouchEnd={() => handleSliderChange('particleSize')}
              />
            </div>
          </div>
        </div>

        {/* 固定在底部的"关于"部分 */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(42, 82, 152, 0.1)',
          paddingTop: '20px',
          marginTop: 'auto',
          width: '100%',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <h3>关于</h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#616161', 
              lineHeight: '1.7', 
              margin: 0,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              作者：李裕翰<br />
              使用 ECharts FlowGL / ECharts Geo / Canvas Heatmap 渲染<br />
              数据来源: EMCWF GRIB2 风场数据<br />
              后端： <a href="https://github.com/lxbme/Griber" target="_blank" rel="noopener noreferrer" style={{ color: '#2a5298', textDecoration: 'none', wordBreak: 'break-all' }}>Griber</a> - 李裕翰
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
