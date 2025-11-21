import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as echarts from 'echarts';
import 'echarts-gl';

// 热力图预设值配置
const HEATMAP_PRESETS = {
  'normal': { opacity: 0.1, blurRadius: 15 },
  'high-transparent': { opacity: 0.05, blurRadius: 15 },
  'precise': { opacity: 1.0, blurRadius: 5 }
};

function WindFieldVisualization({ settings }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const windDataRef = useRef(null);
  const typhonDataRef = useRef(null); // 台风数据
  const mapCanvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const boundaryCanvasRef = useRef(null); // 国家边界线画布
  const containerRef = useRef(null); // 外层容器引用
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  
  // 从 props 获取设置或使用默认值
  const heatmapPreset = settings?.heatmapPreset ?? 'normal';
  const preset = HEATMAP_PRESETS[heatmapPreset] || HEATMAP_PRESETS['normal'];
  const HEATMAP_CONFIG = {
    opacity: preset.opacity,
    blurRadius: preset.blurRadius
  };

  // 获取昨日 UTC 日期（格式：YYYYMMDD）- 作为后备选项
  const getYesterdayDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const year = yesterday.getUTCFullYear();
    const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // 使用批量API获取数据
  const fetchRangeData = async (date, batchParam) => {
    const latStart = 57;
    const latEnd = 5; // 扩展到北纬10度，确保海南岛完整显示
    const lonStart = 65;
    const lonEnd = 139;
    const step = 0.25;

    // 构建批量请求URL
    const url = `/range?slat=${latEnd}&slon=${lonStart}&elat=${latStart}&elon=${lonEnd}&step=${step}&date=${date}&batch=${batchParam}`;
    
    console.log(`使用批量API请求: ${url}`);
    setProgress(50); // 显示请求中
    
    try {
      const response = await fetch(url);
      
      // 检查HTTP状态
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`服务器错误 (${response.status}):`, errorText);
        throw new Error(`服务器返回错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('批量数据获取失败');
      }
      
      setProgress(80); // 数据获取完成，开始处理
      
      // 转换数据格式
      const results = [];
      for (let i = 0; i < data.lats.length; i++) {
        results.push({
          lat: data.lats[i],
          lon: data.lons[i],
          u: data.u[i],
          v: data.v[i],
          success: true
        });
      }
      
      console.log(`批量获取 ${results.length} 个点的数据成功`);
      setProgress(100);
      
      return results;
    } catch (err) {
      console.error('批量数据获取失败:', err);
      throw err;
    }
  };

  // 从缓存中获取数据
  const getCachedData = (date, batch) => {
    try {
      const cacheKey = `wind_data_${date}_${batch}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // 检查缓存是否在24小时内
        const cacheTime = data.timestamp;
        const now = Date.now();
        if (now - cacheTime < 24 * 60 * 60 * 1000) {
          console.log(`使用缓存数据: ${date} ${batch}`);
          return data.windData;
        } else {
          // 缓存过期，删除
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error('读取缓存失败:', err);
    }
    return null;
  };

  // 保存数据到缓存
  const setCachedData = (date, batch, windData) => {
    try {
      const cacheKey = `wind_data_${date}_${batch}`;
      const cacheData = {
        timestamp: Date.now(),
        windData: windData
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`数据已缓存: ${date} ${batch}`);
    } catch (err) {
      console.error('保存缓存失败:', err);
      // 如果存储空间不足，清理旧缓存
      if (err.name === 'QuotaExceededError') {
        console.log('存储空间不足，清理旧缓存...');
        // 清理所有风场数据缓存
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('wind_data_')) {
            localStorage.removeItem(key);
          }
        }
        // 重试保存
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryErr) {
          console.error('重试保存缓存失败:', retryErr);
        }
      }
    }
  };

  // 获取风场数据
  const fetchWindData = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // 使用设置中的日期，如果没有则使用昨天的日期
      const date = settings?.date ?? getYesterdayDate();
      const batch = settings?.batch ?? '18z';
      
      // 先尝试从缓存获取
      const cachedData = getCachedData(date, batch);
      if (cachedData) {
        setLoading(false);
        return cachedData;
      }

      console.log(`开始批量获取数据，日期: ${date}`);

      // 使用批量API获取数据
      const results = await fetchRangeData(date, batch);
      const validData = results.filter(r => r.success !== false);

      console.log(`成功获取 ${validData.length} 个点的数据`);

      if (validData.length === 0) {
        throw new Error('未能获取到有效数据');
      }

      // 转换为 FlowGL 需要的格式，添加风速作为第5维度用于颜色映射
      const data = validData.map(item => {
        const speed = Math.sqrt(item.u * item.u + item.v * item.v);
        // u: 纬向风(东西向), 正值向东; v: 经向风(南北向), 正值向北
        // 在 ECharts 的 value 坐标系中，x向右为正（对应经度增加，向东），y向上为正（对应纬度增加，向北）
        // 所以 u 对应 x 方向，v 对应 y 方向，都不需要取反
        return [item.lon, item.lat, item.u, item.v, speed];
      });
      
      // 输出一些样本数据用于调试
      console.log('样本数据（前5个点）:');
      validData.slice(0, 5).forEach(item => {
        console.log(`经度:${item.lon}, 纬度:${item.lat}, u:${item.u.toFixed(2)}, v:${item.v.toFixed(2)}`);
      });
      
      // 计算数据范围
      const lons = validData.map(d => d.lon);
      const lats = validData.map(d => d.lat);
      
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      // 计算风速大小用于颜色映射
      const speeds = validData.map(d => Math.sqrt(d.u * d.u + d.v * d.v));
      const maxSpeed = Math.max(...speeds);

      const windData = { data, minLon, maxLon, minLat, maxLat, maxSpeed };
      
      // 保存到缓存
      setCachedData(date, batch, windData);

      return windData;
    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // 获取台风数据
  const fetchTyphonData = async (date, batch) => {
    try {
      const url = `/typhoon?date=${date}&batch=${batch}`;
      console.log(`获取台风数据: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 如果数据为空，返回 null
      if (!data.now || data.now.length === 0) {
        console.log('台风数据为空');
        return null;
      }
      
      console.log(`获取到 ${data.now.length} 个台风`);
      
      // 解析台风数据
      const typhons = {
        now: data.now.map(typhon => ({
          name: typhon.name || 'UNNAMED',
          lat: parseFloat(typhon.cma_lat || 0),
          lon: parseFloat(typhon.cma_lon || 0),
          wind: parseFloat(typhon.cma_wind || 0),
          pressure: parseFloat(typhon.cma_pres || 0),
          category: typhon.cma_cat || '0'
        })),
        traces: {}
      };
      
      // 解析轨迹数据
      if (data.trace) {
        Object.keys(data.trace).forEach(typhonName => {
          const traceData = data.trace[typhonName];
          Object.keys(traceData).forEach(number => {
            const points = traceData[number].map(pointStr => {
              try {
                const point = JSON.parse(pointStr);
                return {
                  lat: parseFloat(point.cma_lat || 0),
                  lon: parseFloat(point.cma_lon || 0),
                  wind: parseFloat(point.cma_wind || 0),
                  time: point.iso_time || ''
                };
              } catch (e) {
                console.warn('解析轨迹点失败:', e);
                return null;
              }
            }).filter(p => p !== null);
            
            if (points.length > 0) {
              typhons.traces[typhonName] = points;
            }
          });
        });
      }
      
      return typhons;
    } catch (err) {
      console.warn('获取台风数据失败:', err);
      return null; // 失败时返回 null，不影响主流程
    }
  };

  // 根据国际标准（Saffir-Simpson Scale）计算台风类型
  const getTyphonCategory = (wind) => {
    // 风速单位：m/s
    // 国际标准分类：
    // TD (Tropical Depression): < 17 m/s (< 33 kt)
    // TS (Tropical Storm): 17-24 m/s (34-47 kt)
    // STS (Severe Tropical Storm): 25-32 m/s (48-63 kt)
    // TY (Typhoon): 33-41 m/s (64-80 kt)
    // STY (Severe Typhoon): 42-50 m/s (81-99 kt)
    // SuperTY (Super Typhoon): ≥ 51 m/s (≥ 100 kt)
    
    if (wind < 17) {
      return { code: 'TD', name: '热带低压', nameEn: 'Tropical Depression' };
    } else if (wind < 25) {
      return { code: 'TS', name: '热带风暴', nameEn: 'Tropical Storm' };
    } else if (wind < 33) {
      return { code: 'STS', name: '强热带风暴', nameEn: 'Severe Tropical Storm' };
    } else if (wind < 42) {
      return { code: 'TY', name: '台风', nameEn: 'Typhoon' };
    } else if (wind < 51) {
      return { code: 'STY', name: '强台风', nameEn: 'Severe Typhoon' };
    } else {
      return { code: 'SuperTY', name: '超强台风', nameEn: 'Super Typhoon' };
    }
  };

  // 获取台风轨迹颜色（亮青色->黄色->红色）
  const getTyphonTraceColor = (wind, opacity = 0.7) => {
    // 风速范围：0-80 m/s
    // 亮青色 (0, 255, 255) -> 黄色 (255, 255, 0) -> 红色 (255, 0, 0)
    const normalizedWind = Math.max(0, Math.min(80, wind));
    
    if (normalizedWind <= 40) {
      // 0-40 m/s: 亮青色 -> 黄色
      const ratio = normalizedWind / 40;
      const r = Math.round(0 + (255 - 0) * ratio);
      const g = Math.round(255);
      const b = Math.round(255 - (255 - 0) * ratio);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      // 40-80 m/s: 黄色 -> 红色
      const ratio = (normalizedWind - 40) / 40;
      const r = Math.round(255);
      const g = Math.round(255 - (255 - 0) * ratio);
      const b = Math.round(0);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  };

  // 获取风速对应的颜色
  const getColorForSpeed = (speed, opacity = 0.6) => {
    const colors = [
      // 0-10 m/s: 深蓝到青绿
      { speed: 0, color: [0, 0, 139] },
      { speed: 2.5, color: [0, 0, 205] },
      { speed: 5, color: [0, 100, 200] },
      { speed: 7.5, color: [0, 150, 200] },
      { speed: 10, color: [0, 206, 209] },
      // 10-20 m/s: 青绿到黄到橙色
      { speed: 12, color: [64, 224, 208] },
      { speed: 14, color: [0, 255, 127] },
      { speed: 16, color: [173, 255, 47] },
      { speed: 18, color: [255, 255, 0] },
      { speed: 20, color: [255, 165, 0] },
      // 20-30 m/s: 橙色到红色
      { speed: 23, color: [255, 140, 0] },
      { speed: 26, color: [255, 99, 71] },
      { speed: 30, color: [255, 0, 0] },
      // 30-40 m/s: 红色到紫色
      { speed: 33, color: [220, 20, 60] },
      { speed: 37, color: [186, 85, 211] },
      { speed: 40, color: [147, 112, 219] },
      // 40-60 m/s: 紫色到白色
      { speed: 45, color: [138, 43, 226] },
      { speed: 50, color: [200, 150, 240] },
      { speed: 60, color: [255, 255, 255] }
    ];
    
    // 找到合适的颜色区间
    let lowerIdx = 0;
    let upperIdx = colors.length - 1;
    
    for (let i = 0; i < colors.length - 1; i++) {
      if (speed >= colors[i].speed && speed <= colors[i + 1].speed) {
        lowerIdx = i;
        upperIdx = i + 1;
        break;
      }
    }
    
    // 线性插值
    const lower = colors[lowerIdx];
    const upper = colors[upperIdx];
    const ratio = (speed - lower.speed) / (upper.speed - lower.speed);
    
    const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * ratio);
    const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * ratio);
    const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * ratio);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // 绘制热力图
  const drawHeatmap = (windData, options = {}) => {
    if (!heatmapCanvasRef.current || !chartRef.current) return;

    // 热力图配置选项
    const {
      opacity = 0.5,        // 热力图整体透明度 (0-1)
      blurRadius = 20,      // 模糊半径（像素）
    } = options;

    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 获取容器尺寸
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;
    
    // 设置 canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    const minLon = windData.minLon;
    const maxLon = windData.maxLon;
    const minLat = windData.minLat;
    const maxLat = windData.maxLat;
    
    // 经纬度转像素坐标
    const lonToPixel = (lon) => {
      return (lon - minLon) / (maxLon - minLon) * containerWidth;
    };
    
    const latToPixel = (lat) => {
      return (maxLat - lat) / (maxLat - minLat) * containerHeight;
    };
    
    // 绘制每个数据点
    windData.data.forEach(point => {
      const lon = point[0];
      const lat = point[1];
      const speed = point[4];
      
      const x = lonToPixel(lon);
      const y = latToPixel(lat);
      
      // 根据风速获取颜色（使用配置的透明度）
      const color = getColorForSpeed(speed, opacity);
      
      // 创建径向渐变以实现模糊效果
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blurRadius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - blurRadius, y - blurRadius, blurRadius * 2, blurRadius * 2);
    });
    
    console.log(`热力图绘制完成 (透明度: ${opacity}, 模糊半径: ${blurRadius})`);
  };

  // 绘制地图底图
  const drawMapBackground = (windData) => {
    if (!mapCanvasRef.current || !chartRef.current) return;

    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 获取容器尺寸
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;
    
    // 设置 canvas 尺寸（使用更高倍数的分辨率来提高清晰度）
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // 至少2倍分辨率
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // 如果选择无底图，直接返回
    const mapLayer = settings?.mapLayer ?? 'openstreet';
    if (mapLayer === 'none') {
      console.log('无底图模式');
      return;
    }
    
    // 设置高质量渲染
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const minLon = windData.minLon;
    const maxLon = windData.maxLon;
    const minLat = windData.minLat;
    const maxLat = windData.maxLat;
    
    // 选择合适的缩放级别（更高 = 更清晰）
    const zoom = 6;
    const tileSize = 256;
    
    // 经纬度转瓦片坐标
    const lonToTile = (lon, z) => {
      return Math.floor((lon + 180) / 360 * Math.pow(2, z));
    };
    
    const latToTile = (lat, z) => {
      return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    };
    
    // 瓦片坐标转经纬度
    const tileToLon = (x, z) => {
      return x / Math.pow(2, z) * 360 - 180;
    };
    
    const tileToLat = (y, z) => {
      const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
      return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    };
    
    // 经纬度转 canvas 像素坐标
    const lonToPixel = (lon) => {
      return (lon - minLon) / (maxLon - minLon) * containerWidth;
    };
    
    const latToPixel = (lat) => {
      return (maxLat - lat) / (maxLat - minLat) * containerHeight;
    };
    
    // 计算需要加载的瓦片范围
    const minTileX = lonToTile(minLon, zoom);
    const maxTileX = lonToTile(maxLon, zoom);
    const minTileY = latToTile(maxLat, zoom);
    const maxTileY = latToTile(minLat, zoom);
    
    // 根据底图类型选择瓦片服务 URL
    const getTileUrl = (x, y, z) => {
      if (mapLayer === 'topo') {
        return `https://tile.opentopomap.org/${z}/${x}/${y}.png`;
      } else if (mapLayer === 'openstreet') {
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
      return null;
    };
    
    console.log(`加载地图瓦片: ${mapLayer}, X[${minTileX}-${maxTileX}], Y[${minTileY}-${maxTileY}], 缩放级别: ${zoom}`);
    
    let loadedTiles = 0;
    const totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
    
    // 加载并绘制瓦片
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const tileUrl = getTileUrl(x, y, zoom);
        if (!tileUrl) {
          loadedTiles++;
          continue;
        }
        
        img.src = tileUrl;

        img.onload = () => {
          // 计算瓦片对应的经纬度范围
          const tileLon1 = tileToLon(x, zoom);
          const tileLon2 = tileToLon(x + 1, zoom);
          const tileLat1 = tileToLat(y, zoom);
          const tileLat2 = tileToLat(y + 1, zoom);
          
          // 计算瓦片在 canvas 上的位置和大小
          const px1 = lonToPixel(tileLon1);
          const px2 = lonToPixel(tileLon2);
          const py1 = latToPixel(tileLat1);
          const py2 = latToPixel(tileLat2);
          
          // 使用高质量绘制
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // 绘制瓦片（100% 不透明）
          ctx.drawImage(img, px1, py1, px2 - px1, py2 - py1);
          
          loadedTiles++;
          if (loadedTiles === totalTiles) {
            console.log(`地图底图加载完成: ${mapLayer}`);
          }
        };
        
        img.onerror = () => {
          console.warn(`瓦片加载失败: ${mapLayer}/${zoom}/${x}/${y}`);
          loadedTiles++;
        };
      }
    }
  };

  // 绘制国家边界线
  const drawBoundaries = async (windData) => {
    if (!boundaryCanvasRef.current || !chartRef.current) return;

    const canvas = boundaryCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 获取容器尺寸
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;
    
    // 设置 canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    const minLon = windData.minLon;
    const maxLon = windData.maxLon;
    const minLat = windData.minLat;
    const maxLat = windData.maxLat;
    
    // 经纬度转像素坐标
    const lonToPixel = (lon) => {
      return (lon - minLon) / (maxLon - minLon) * containerWidth;
    };
    
    const latToPixel = (lat) => {
      return (maxLat - lat) / (maxLat - minLat) * containerHeight;
    };

    try {
      // 获取世界地图 GeoJSON 数据（从 Natural Earth 数据）
      const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson');
      const geojson = await response.json();
      
      // 设置边界线样式
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // 白色边界线
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // 绘制每个国家的边界
      geojson.features.forEach(feature => {
        const geometry = feature.geometry;
        
        const drawPolygon = (coordinates) => {
          coordinates.forEach((ring) => {
            let prevLon = null;
            let prevLat = null;
            let pathStarted = false;
            
            ring.forEach(([lon, lat], index) => {
              const inBounds = lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
              
              // 检测是否跨越了很大距离（例如跨越国际日期变更线）
              let skipConnection = false;
              if (prevLon !== null && prevLat !== null) {
                const lonDiff = Math.abs(lon - prevLon);
                const latDiff = Math.abs(lat - prevLat);
                // 如果经度或纬度差异过大，说明跨越了边界，需要断开
                if (lonDiff > 100 || latDiff > 50) {
                  skipConnection = true;
                }
              }
              
              if (inBounds) {
                const x = lonToPixel(lon);
                const y = latToPixel(lat);
                
                // 如果需要跨越断开，或者是新路径的开始
                if (skipConnection || !pathStarted) {
                  if (pathStarted) {
                    ctx.stroke(); // 先绘制之前的路径
                  }
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  pathStarted = true;
                } else {
                  ctx.lineTo(x, y);
                }
              } else {
                // 当前点不在范围内，如果之前有路径，先绘制它
                if (pathStarted) {
                  ctx.stroke();
                  pathStarted = false;
                }
              }
              
              prevLon = lon;
              prevLat = lat;
            });
            
            // 绘制最后的路径段
            if (pathStarted) {
              ctx.stroke();
            }
          });
        };
        
        if (geometry.type === 'Polygon') {
          drawPolygon(geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            drawPolygon(polygon);
          });
        }
      });
      
      console.log('国家边界线绘制完成');
    } catch (error) {
      console.warn('边界线数据加载失败:', error);
    }
  };

  // 初始化图表
  const initChart = (windData) => {
    if (!chartRef.current) return;

    // 绘制地图底图
    drawMapBackground(windData);
    
    // 绘制热力图
    drawHeatmap(windData, HEATMAP_CONFIG);
    
    // 绘制国家边界线
    drawBoundaries(windData);

    // 销毁旧实例
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    // 计算地理坐标的真实长宽比
    const lonSpan = windData.maxLon - windData.minLon; // 经度跨度
    const latSpan = windData.maxLat - windData.minLat; // 纬度跨度
    const geoAspectRatio = lonSpan / latSpan; // 地理长宽比
    
    console.log(`地理长宽比: ${geoAspectRatio.toFixed(2)}`);

    const option = {
      backgroundColor: 'transparent',
      xAxis: {
        type: 'value',
        min: windData.minLon,
        max: windData.maxLon,
        show: false
      },
      yAxis: {
        type: 'value',
        min: windData.minLat,
        max: windData.maxLat,
        show: false
      },
      grid: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      },
      series: [
        // 风场流线层 - 显示风向
        {
          type: 'flowGL',
          data: windData.data,
          particleDensity: settings?.particleDensity ?? 128,
          particleSpeed: settings?.particleSpeed ?? 2.5,
          particleSize: Math.max(0.1, settings?.particleSize ?? 3), // 确保最小值
          particleTrail: 0.5,
          particleLife: 5, // 粒子寿命 5 秒
          // 会导致故障，不要设置
          // gridWidth: 128,
          // gridHeight: 128,
          itemStyle: {
            color: 'rgba(255, 255, 255, 0.8)', // 白色流线
            opacity: 0.8
          },
          supersampling: 1.5,
          zlevel: 3 // 确保在边界线之上
        },
        // 台风轨迹线（分段绘制以实现渐变色）
        ...(typhonDataRef.current && typhonDataRef.current.traces ? 
          Object.keys(typhonDataRef.current.traces).flatMap(typhonName => {
            const points = typhonDataRef.current.traces[typhonName];
            if (points.length < 2) return [];
            
            // 将轨迹分成多个小段，每个小段根据风速设置颜色
            const segments = [];
            for (let i = 0; i < points.length - 1; i++) {
              const point1 = points[i];
              const point2 = points[i + 1];
              // 使用两个点的平均风速来确定颜色
              const avgWind = (point1.wind + point2.wind) / 2;
              const color = getTyphonTraceColor(avgWind, 0.7);
              
              segments.push({
                type: 'line',
                data: [[point1.lon, point1.lat], [point2.lon, point2.lat]],
                lineStyle: {
                  color: color,
                  width: 2.5,
                  type: 'solid'
                },
                symbol: 'none',
                smooth: false,
                zlevel: 4,
                animation: false
              });
            }
            return segments;
          }) : []
        ),
        // 台风当前位置
        ...(typhonDataRef.current && typhonDataRef.current.now && typhonDataRef.current.now.length > 0 ? [{
          type: 'scatter',
          data: typhonDataRef.current.now.map(typhon => ({
            value: [typhon.lon, typhon.lat],
            name: typhon.name,
            wind: typhon.wind,
            pressure: typhon.pressure,
            category: typhon.category
          })),
          symbolSize: (data) => {
            // 根据风速调整大小
            const wind = data.wind || 0;
            return Math.max(8, Math.min(20, wind / 2));
          },
          itemStyle: {
            color: (params) => {
              // 根据国际标准风速调整颜色
              const wind = params.data.wind || 0;
              if (wind >= 51) return 'rgba(128, 0, 128, 0.9)'; // 超强台风 (SuperTY) - 紫色
              if (wind >= 42) return 'rgba(255, 0, 0, 0.9)'; // 强台风 (STY) - 红色
              if (wind >= 33) return 'rgba(255, 140, 0, 0.9)'; // 台风 (TY) - 橙色
              if (wind >= 25) return 'rgba(255, 255, 0, 0.9)'; // 强热带风暴 (STS) - 黄色
              if (wind >= 17) return 'rgba(0, 255, 255, 0.9)'; // 热带风暴 (TS) - 青色
              return 'rgba(173, 216, 230, 0.9)'; // 热带低压 (TD) - 浅蓝色
            },
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => {
              const data = params.data;
              const wind = data.wind || 0;
              const category = getTyphonCategory(wind);
              return `${data.name || 'UNNAMED'}\n${category.name}`;
            },
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: [2, 4],
            borderRadius: 2
          },
          zlevel: 5,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(255, 0, 0, 0.8)'
            },
            label: {
              show: true,
              formatter: (params) => {
                const data = params.data;
                const wind = data.wind || 0;
                const category = getTyphonCategory(wind);
                return `${data.name || 'UNNAMED'}\n${category.name} (${category.code})\n风速: ${data.wind} m/s\n气压: ${data.pressure} hPa`;
              }
            }
          }
        }] : [])
      ]
    };

    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      if (chartInstance.current && windDataRef.current) {
        // 重新绘制所有图层
        drawMapBackground(windDataRef.current);
        drawHeatmap(windDataRef.current, HEATMAP_CONFIG);
        drawBoundaries(windDataRef.current);
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // 更新台风 series
  const updateTyphonSeries = () => {
    if (!chartInstance.current || !windDataRef.current) return;
    
    const series = [];
    
    // 添加台风轨迹线（分段绘制以实现渐变色）
    if (typhonDataRef.current && typhonDataRef.current.traces) {
      Object.keys(typhonDataRef.current.traces).forEach(typhonName => {
        const points = typhonDataRef.current.traces[typhonName];
        if (points.length < 2) return;
        
        // 将轨迹分成多个小段，每个小段根据风速设置颜色
        for (let i = 0; i < points.length - 1; i++) {
          const point1 = points[i];
          const point2 = points[i + 1];
          // 使用两个点的平均风速来确定颜色
          const avgWind = (point1.wind + point2.wind) / 2;
          const color = getTyphonTraceColor(avgWind, 0.7);
          
          series.push({
            type: 'line',
            data: [[point1.lon, point1.lat], [point2.lon, point2.lat]],
            lineStyle: {
              color: color,
              width: 2.5,
              type: 'solid'
            },
            symbol: 'none',
            smooth: false,
            zlevel: 4,
            animation: false
          });
        }
      });
    }
    
    // 添加台风当前位置
    if (typhonDataRef.current && typhonDataRef.current.now && typhonDataRef.current.now.length > 0) {
      series.push({
        type: 'scatter',
        data: typhonDataRef.current.now.map(typhon => ({
          value: [typhon.lon, typhon.lat],
          name: typhon.name,
          wind: typhon.wind,
          pressure: typhon.pressure,
          category: typhon.category
        })),
        symbolSize: (data) => {
          const wind = data.wind || 0;
          return Math.max(8, Math.min(20, wind / 2));
        },
        itemStyle: {
          color: (params) => {
            // 根据国际标准风速调整颜色
            const wind = params.data.wind || 0;
            if (wind >= 51) return 'rgba(128, 0, 128, 0.9)'; // 超强台风 (SuperTY) - 紫色
            if (wind >= 42) return 'rgba(255, 0, 0, 0.9)'; // 强台风 (STY) - 红色
            if (wind >= 33) return 'rgba(255, 140, 0, 0.9)'; // 台风 (TY) - 橙色
            if (wind >= 25) return 'rgba(255, 255, 0, 0.9)'; // 强热带风暴 (STS) - 黄色
            if (wind >= 17) return 'rgba(0, 255, 255, 0.9)'; // 热带风暴 (TS) - 青色
            return 'rgba(173, 216, 230, 0.9)'; // 热带低压 (TD) - 浅蓝色
          },
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params) => {
            const data = params.data;
            const wind = data.wind || 0;
            const category = getTyphonCategory(wind);
            return `${data.name || 'UNNAMED'}\n${category.name}`;
          },
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: [2, 4],
          borderRadius: 2
        },
        zlevel: 5,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(255, 0, 0, 0.8)'
          },
          label: {
            show: true,
            formatter: (params) => {
              const data = params.data;
              const wind = data.wind || 0;
              const category = getTyphonCategory(wind);
              return `${data.name || 'UNNAMED'}\n${category.name} (${category.code})\n风速: ${data.wind} m/s\n气压: ${data.pressure} hPa`;
            }
          }
        }
      });
    }
    
    // 获取当前 option，保留 flowGL series
    const currentOption = chartInstance.current.getOption();
    const flowGLSeries = currentOption.series && currentOption.series.find(s => s.type === 'flowGL');
    
    // 更新 series，保留 flowGL，替换台风相关的 series
    const newSeries = flowGLSeries ? [flowGLSeries, ...series] : series;
    
    chartInstance.current.setOption({
      series: newSeries
    }, { notMerge: false, lazyUpdate: false });
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      // 获取风场数据
      const windData = await fetchWindData();
      if (windData) {
        windDataRef.current = windData;
        setLoading(false);
      }
      
      // 获取台风数据
      const date = settings?.date ?? getYesterdayDate();
      const batch = settings?.batch ?? '18z';
      const typhonData = await fetchTyphonData(date, batch);
      if (typhonData) {
        typhonDataRef.current = typhonData;
        // 如果图表已初始化，更新台风数据
        if (chartInstance.current && windDataRef.current) {
          updateTyphonSeries();
        }
      } else {
        typhonDataRef.current = null;
        // 清除台风数据
        if (chartInstance.current) {
          updateTyphonSeries();
        }
      }
    };
    
    loadData();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [settings?.date, settings?.batch]);

  // 当 loading 结束且有数据时，初始化图表
  useEffect(() => {
    if (!loading && windDataRef.current && chartRef.current && !chartInstance.current) {
      // 使用 requestAnimationFrame 确保 DOM 已经更新完成
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (windDataRef.current && !chartInstance.current) {
            initChart(windDataRef.current);
            // 初始化后，如果有台风数据，更新台风 series
            if (typhonDataRef.current) {
              updateTyphonSeries();
            }
          }
        });
      });
    }
  }, [loading]);

  // 当设置改变时，重新渲染图表
  useEffect(() => {
    if (!loading && windDataRef.current && chartInstance.current) {
      // 更新热力图
      drawHeatmap(windDataRef.current, HEATMAP_CONFIG);
      
      // 更新 ECharts 配置 - 确保 particleSize 等参数正确更新
      const particleSize = Math.max(0.1, settings?.particleSize ?? 3); // 确保最小值
      chartInstance.current.setOption({
        series: [{
          particleDensity: settings?.particleDensity ?? 128,
          particleSpeed: settings?.particleSpeed ?? 2.5,
          particleSize: particleSize,
          particleTrail: 0.5, // 保持拖尾效果
          particleLife: 5, // 粒子寿命 5 秒
          itemStyle: {
            color: 'rgba(255, 255, 255, 0.8)',
            opacity: 0.8
          },
          supersampling: 1.5,
          zlevel: 3
        }]
      }, { notMerge: false, lazyUpdate: false });
    }
  }, [settings?.heatmapPreset, settings?.particleDensity, settings?.particleSpeed, settings?.particleSize]);

  // 当底图类型改变时，重新绘制底图
  useEffect(() => {
    if (!loading && windDataRef.current) {
      drawMapBackground(windDataRef.current);
    }
  }, [settings?.mapLayer]);

  // 注意：batch 改变时通过 key 强制重新挂载组件，无需单独监听

  // 鼠标移动事件处理 - 显示风速标签
  useEffect(() => {
    if (!chartRef.current || !windDataRef.current) return;

    const handleMouseMove = (event) => {
      const windData = windDataRef.current;
      if (!windData) return;

      const container = chartRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // 计算鼠标位置对应的经纬度
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      const lonRatio = mouseX / containerWidth;
      const latRatio = mouseY / containerHeight;
      
      const mouseLon = windData.minLon + lonRatio * (windData.maxLon - windData.minLon);
      const mouseLat = windData.maxLat - latRatio * (windData.maxLat - windData.minLat);

      // 查找最近的风场数据点
      let nearestPoint = null;
      let minDistance = Infinity;
      const searchRadius = 2; // 搜索半径（度）

      windData.data.forEach(point => {
        const [lon, lat, u, v, speed] = point;
        const distance = Math.sqrt(
          Math.pow(lon - mouseLon, 2) + Math.pow(lat - mouseLat, 2)
        );

        if (distance < minDistance && distance < searchRadius) {
          minDistance = distance;
          nearestPoint = { lon, lat, u, v, speed };
        }
      });

      if (nearestPoint) {
        // 计算风向（气象风向 = 风来自的方向）
        // atan2(v, u) 给出风吹向的方向，需要加 180° 得到风来自的方向
        let windDirection = (Math.atan2(nearestPoint.v, nearestPoint.u) * 180 / Math.PI + 270) % 360;
        if (windDirection < 0) windDirection += 360;
        
        // 风向方位
        const getDirectionName = (deg) => {
          const directions = ['北', '东北偏北', '东北', '东北偏东', '东', '东南偏东', '东南', '东南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北'];
          const index = Math.round(deg / 22.5) % 16;
          return directions[index];
        };

        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          data: {
            lon: nearestPoint.lon.toFixed(2),
            lat: nearestPoint.lat.toFixed(2),
            speed: nearestPoint.speed.toFixed(2),
            direction: windDirection.toFixed(0),
            directionName: getDirectionName(windDirection),
            u: nearestPoint.u.toFixed(2),
            v: nearestPoint.v.toFixed(2)
          }
        });
      } else {
        setTooltip({ visible: false, x: 0, y: 0, data: null });
      }
    };

    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, y: 0, data: null });
    };

    const container = chartRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loading, windDataRef.current]);

  // 计算容器样式，保持地理长宽比（适应父容器）
  const getContainerStyle = () => {
    // 如果正在加载或出错，使用默认样式
    if (loading || error || !windDataRef.current) {
      return { 
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        boxSizing: 'border-box'
      };
    }
    
    const windData = windDataRef.current;
    const lonSpan = windData.maxLon - windData.minLon;
    const latSpan = windData.maxLat - windData.minLat;
    const geoAspectRatio = lonSpan / latSpan;
    
    return {
      width: '100%',
      aspectRatio: `${geoAspectRatio}`,
      position: 'relative',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    };
  };

  return (
    <div style={{ ...getContainerStyle(), overflow: 'hidden' }}>
      {/* 地图底图 Canvas */}
      <canvas 
        ref={mapCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          imageRendering: 'high-quality'
        }}
      />
      {/* 热力图 Canvas */}
      <canvas 
        ref={heatmapCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      {/* 国家边界线 Canvas */}
      <canvas 
        ref={boundaryCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '18px',
          zIndex: 1000,
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <div>正在加载数据...</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>{progress}%</div>
          <div style={{
            marginTop: '10px',
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff0000',
          fontSize: '18px',
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          错误: {error}
        </div>
      )}
      {/* 风场图层 */}
      <div ref={chartRef} style={{ 
        width: '100%', 
        height: '100%', 
        margin: 0, 
        padding: 0,
        position: 'relative',
        zIndex: 3
      }}></div>
      
      {/* 风速标签 Tooltip - 使用 Portal 渲染到 body 以避免被父容器裁剪或遮挡 */}
      {tooltip.visible && tooltip.data && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y + 15,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#1e293b', // slate-800
          padding: '16px',
          borderRadius: '16px',
          fontSize: '14px',
          lineHeight: '1.5',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          minWidth: '200px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px', 
            paddingBottom: '8px', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)' 
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6', // blue-500
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
            }}></div>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>实时风场数据</span>
          </div>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>经纬度</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                {tooltip.data.lon}°E, {tooltip.data.lat}°N
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>风速</span>
              <span style={{ 
                fontWeight: '700', 
                color: '#0f172a', 
                fontSize: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 6px',
                borderRadius: '6px'
              }}>
                {tooltip.data.speed} m/s
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>风向</span>
              <span style={{ fontWeight: '500' }}>
                {tooltip.data.directionName} <span style={{ color: '#94a3b8' }}>({tooltip.data.direction}°)</span>
              </span>
            </div>
          </div>

          <div style={{ 
            marginTop: '12px', 
            paddingTop: '8px', 
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            fontSize: '12px',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>U Component</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltip.data.u} m/s</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>V Component</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltip.data.v} m/s</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default WindFieldVisualization;

