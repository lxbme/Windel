import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { TrendingUp } from 'lucide-react';

/**
 * 省会城市风速排名组件
 * 展示本周各省会城市的平均风速排名
 */
const ProvinceWindRanking = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [chartData, setChartData] = useState(null);
  const chartRef = React.useRef(null);

  // 中国省会城市坐标
  const provincialCapitals = [
    { name: '北京', lat: 39.90, lon: 116.41 },
    { name: '上海', lat: 31.23, lon: 121.47 },
    { name: '天津', lat: 39.13, lon: 117.20 },
    { name: '重庆', lat: 29.56, lon: 106.55 },
    { name: '哈尔滨', lat: 45.75, lon: 126.65 },
    { name: '长春', lat: 43.88, lon: 125.32 },
    { name: '沈阳', lat: 41.80, lon: 123.43 },
    { name: '呼和浩特', lat: 40.84, lon: 111.75 },
    { name: '石家庄', lat: 38.05, lon: 114.48 },
    { name: '乌鲁木齐', lat: 43.83, lon: 87.62 },
    { name: '兰州', lat: 36.06, lon: 103.83 },
    { name: '西宁', lat: 36.62, lon: 101.78 },
    { name: '西安', lat: 34.27, lon: 108.95 },
    { name: '银川', lat: 38.47, lon: 106.27 },
    { name: '郑州', lat: 34.76, lon: 113.65 },
    { name: '济南', lat: 36.65, lon: 117.12 },
    { name: '太原', lat: 37.87, lon: 112.55 },
    { name: '合肥', lat: 31.86, lon: 117.27 },
    { name: '武汉', lat: 30.58, lon: 114.30 },
    { name: '长沙', lat: 28.23, lon: 112.94 },
    { name: '南京', lat: 32.06, lon: 118.78 },
    { name: '成都', lat: 30.67, lon: 104.06 },
    { name: '贵阳', lat: 26.58, lon: 106.71 },
    { name: '昆明', lat: 25.04, lon: 102.71 },
    { name: '南宁', lat: 22.82, lon: 108.32 },
    { name: '拉萨', lat: 29.65, lon: 91.13 },
    { name: '杭州', lat: 30.25, lon: 120.17 },
    { name: '福州', lat: 26.08, lon: 119.30 },
    { name: '南昌', lat: 28.68, lon: 115.86 },
    { name: '广州', lat: 23.13, lon: 113.26 },
    { name: '海口', lat: 20.04, lon: 110.20 },
  ];

  // 获取本周日期范围
  const getThisWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日
    
    // 计算本周一
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    // 计算本周日或今天（取较早的）
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endDate = sunday > now ? now : sunday;
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    
    return {
      startDate: formatDate(monday),
      endDate: formatDate(endDate)
    };
  };

  // 获取数据并渲染图表
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setFromCache(false);

        const { startDate, endDate } = getThisWeekRange();
        const batch = '12z';
        
        // 生成缓存键
        const cacheKey = `province_wind_ranking_${startDate}_${endDate}_${batch}`;
        const cacheTimestampKey = `${cacheKey}_timestamp`;
        
        // 尝试从缓存读取
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
        
        // 检查缓存是否有效（24小时）
        const cacheValidDuration = 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < cacheValidDuration) {
          // 使用缓存数据
          console.log('使用省会城市风速排名缓存数据');
          const validResults = JSON.parse(cachedData);
          setChartData(validResults);
          setFromCache(true);
          setLoading(false);
          return;
        }
        
        // 缓存无效或不存在，从服务器获取
        console.log('从服务器获取省会城市风速排名数据');
        
        // 并发请求所有城市数据
        const promises = provincialCapitals.map(async (city) => {
          try {
            const url = `/daterange?lat=${city.lat}&lon=${city.lon}&start_date=${startDate}&end_date=${endDate}&batch=${batch}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success && result.u && result.v) {
              // 计算每天的风速
              const windSpeeds = result.u.map((u, index) => {
                const v = result.v[index];
                return Math.sqrt(u * u + v * v);
              });
              
              // 计算平均风速
              const avgSpeed = windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length;
              
              return {
                name: city.name,
                avgSpeed: avgSpeed
              };
            }
            return null;
          } catch (err) {
            console.error(`获取${city.name}数据失败:`, err);
            return null;
          }
        });

        const results = await Promise.all(promises);
        
        // 过滤掉失败的请求，并按风速排序
        const validResults = results
          .filter(r => r !== null)
          .sort((a, b) => b.avgSpeed - a.avgSpeed);

        if (validResults.length === 0) {
          setError('无法获取数据');
          return;
        }

        // 保存到缓存
        try {
          localStorage.setItem(cacheKey, JSON.stringify(validResults));
          localStorage.setItem(cacheTimestampKey, now.toString());
          console.log('省会城市风速排名数据已缓存');
        } catch (e) {
          console.warn('缓存保存失败:', e);
          // 如果存储空间满了，清理旧缓存
          if (e.name === 'QuotaExceededError') {
            clearOldCache();
            try {
              localStorage.setItem(cacheKey, JSON.stringify(validResults));
              localStorage.setItem(cacheTimestampKey, now.toString());
            } catch (e2) {
              console.error('清理后仍无法缓存:', e2);
            }
          }
        }

        // 设置图表数据
        setChartData(validResults);

      } catch (err) {
        setError(`网络错误: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // 当数据准备好时渲染图表
  useEffect(() => {
    if (chartData && chartRef.current) {
      renderChart(chartData);
    }
  }, [chartData]);
  
  // 清理旧缓存
  const clearOldCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('province_wind_ranking_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });
    console.log(`清理了 ${keysToRemove.length} 个旧缓存`);
  };

  // 渲染Echarts图表
  const renderChart = (data) => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    
    const option = {
      grid: {
        left: '40px',
        right: '40px',
        top: '30px',
        bottom: '50px'
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: {
          fontSize: 9,
          color: '#475569',
          rotate: 45,
          interval: 0
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: '平均风速 (m/s)',
        nameTextStyle: {
          fontSize: 10,
          color: '#64748b'
        },
        axisLabel: {
          fontSize: 9,
          color: '#64748b'
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      series: [
        {
          type: 'bar',
          data: data.map(d => d.avgSpeed.toFixed(2)),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 8,
            color: '#64748b'
          },
          barWidth: '60%'
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const data = params[0];
          return `${data.name}<br/>平均风速: <b>${data.value} m/s</b>`;
        }
      }
    };

    chart.setOption(option);

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[280px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">加载省会城市风速数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={chartRef} className="w-full h-full min-h-[280px]"></div>
      {fromCache && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md z-10">
          <span>✓ 使用缓存</span>
        </div>
      )}
    </div>
  );
};

export default ProvinceWindRanking;

