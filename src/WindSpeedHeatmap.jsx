import React, { useState, useEffect } from 'react';
import { Wind, MapPin, Calendar, RefreshCw } from 'lucide-react';

/**
 * 风速热力图组件 - 类似GitHub提交日历
 * 默认显示成都2025年全年数据
 */
const WindSpeedHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ used: 0, fetched: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // 默认设置：成都坐标
  const location = {
    lat: 30.67,
    lon: 104.06,
    name: '成都'
  };

  // 2025年日期范围
  const year = 2025;
  const batch = '12z'; // 固定批次

  // 获取某个月的日期范围
  const getMonthDateRange = (year, month) => {
    const startDate = `${year}${String(month).padStart(2, '0')}01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  // 判断月份是否在未来
  const isMonthInFuture = (year, month) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript月份从0开始
    
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // 获取数据
  useEffect(() => {
    const fetchData = async (forceRefresh = false) => {
      try {
        setLoading(true);
        setCacheInfo({ used: 0, fetched: 0 });
        setError(null);
        
        const allData = {};
        let usedCacheCount = 0;
        let fetchedCount = 0;
        
        // 按月请求数据
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const now = Date.now();
        const cacheValidDuration = 24 * 60 * 60 * 1000; // 24小时
        
        // 计算需要请求的月份数（排除未来月份）
        const validMonths = months.filter(month => !isMonthInFuture(year, month));
        setLoadingProgress({ current: 0, total: validMonths.length });
        
        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          
          // 如果是未来月份，跳过请求
          if (isMonthInFuture(year, month)) {
            console.log(`跳过未来月份: ${year}-${month}`);
            continue;
          }
          
          const { startDate, endDate } = getMonthDateRange(year, month);
          const cacheKey = `windspeed_heatmap_${location.lat}_${location.lon}_${startDate}_${endDate}_${batch}`;
          
          // 尝试从缓存读取
          const cachedData = localStorage.getItem(cacheKey);
          const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
          
          if (!forceRefresh && cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < cacheValidDuration) {
            // 使用缓存数据
            const monthData = JSON.parse(cachedData);
            Object.assign(allData, monthData);
            usedCacheCount++;
            console.log(`使用缓存: ${year}-${month}`);
          } else {
            // 从服务器获取
            try {
              console.log(`获取数据: ${year}-${month}`);
              const url = `/daterange?lat=${location.lat}&lon=${location.lon}&start_date=${startDate}&end_date=${endDate}&batch=${batch}`;
              const response = await fetch(url);
              const result = await response.json();

              if (result.success) {
                // 计算风速（u和v的合成）
                const windSpeeds = result.u.map((u, index) => {
                  const v = result.v[index];
                  return Math.sqrt(u * u + v * v);
                });

                // 组合日期和风速数据
                const monthData = {};
                result.dates.forEach((date, index) => {
                  monthData[date] = windSpeeds[index];
                });

                Object.assign(allData, monthData);
                fetchedCount++;
                
                // 保存到缓存
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(monthData));
                  localStorage.setItem(`${cacheKey}_timestamp`, now.toString());
                } catch (e) {
                  console.warn(`缓存保存失败 (${year}-${month}):`, e);
                  if (e.name === 'QuotaExceededError') {
                    clearOldCache();
                    try {
                      localStorage.setItem(cacheKey, JSON.stringify(monthData));
                      localStorage.setItem(`${cacheKey}_timestamp`, now.toString());
                    } catch (e2) {
                      console.error('清理后仍无法缓存:', e2);
                    }
                  }
                }
              } else {
                console.error(`获取失败: ${year}-${month}`);
              }
            } catch (err) {
              console.error(`请求错误 (${year}-${month}):`, err);
            }
          }
          
          // 更新进度
          setLoadingProgress({ 
            current: usedCacheCount + fetchedCount, 
            total: validMonths.length 
          });
        }
        
        setData(allData);
        setCacheInfo({ used: usedCacheCount, fetched: fetchedCount });
        console.log(`数据加载完成 - 缓存: ${usedCacheCount}个月, 获取: ${fetchedCount}个月`);
        
      } catch (err) {
        setError(`网络错误: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // refreshKey 变化时强制刷新
    fetchData(refreshKey > 0);
  }, [refreshKey]);
  
  // 手动刷新函数
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // 清理旧缓存
  const clearOldCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('windspeed_heatmap_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });
    console.log(`清理了 ${keysToRemove.length} 个旧缓存`);
  };

  // 按月份生成日历数据
  const generateCalendarData = () => {
    const monthsData = [];
    
    for (let month = 0; month < 12; month++) {
      const monthWeeks = [];
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // 计算该月第一天是星期几
      const startDayOfWeek = firstDay.getDay();
      
      // 回退到该月第一周的周日
      let currentDate = new Date(firstDay);
      currentDate.setDate(currentDate.getDate() - startDayOfWeek);
      
      let week = [];
      
      // 生成该月的所有周
      while (currentDate <= lastDay) {
        const dateStr = formatDate(currentDate);
        const windSpeed = data ? data[dateStr] : null;
        const inMonth = currentDate.getMonth() === month;
        
        week.push({
          date: new Date(currentDate),
          dateStr: dateStr,
          windSpeed: windSpeed,
          inRange: inMonth,
          month: month
        });
        
        // 如果是周六，结束这一周
        if (currentDate.getDay() === 6) {
          monthWeeks.push(week);
          week = [];
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 添加未完成的最后一周
      if (week.length > 0) {
        while (week.length < 7) {
          week.push({ date: null, inRange: false });
        }
        monthWeeks.push(week);
      }
      
      monthsData.push({
        month: month,
        monthName: months[month],
        weeks: monthWeeks
      });
    }
    
    return monthsData;
  };

  // 格式化日期为YYYYMMDD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // RGB颜色插值函数
  const interpolateColor = (color1, color2, factor) => {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // 根据风速获取颜色（平滑渐变）
  const getColor = (windSpeed) => {
    if (!windSpeed && windSpeed !== 0) return '#e5e7eb'; // 灰色 - 无数据
    
    // 定义颜色梯度点（从浅蓝到深蓝）
    const colorStops = [
      { speed: 0, color: '#dbeafe' },   // 很弱 - 浅蓝
      { speed: 3, color: '#93c5fd' },   // 弱 - 亮蓝
      { speed: 6, color: '#60a5fa' },   // 中等 - 中蓝
      { speed: 9, color: '#3b82f6' },   // 较强 - 标准蓝
      { speed: 12, color: '#2563eb' },  // 强 - 深蓝
      { speed: 15, color: '#1e40af' }   // 很强 - 极深蓝
    ];
    
    // 如果风速超过最大值，返回最深的颜色
    if (windSpeed >= colorStops[colorStops.length - 1].speed) {
      return colorStops[colorStops.length - 1].color;
    }
    
    // 如果风速低于最小值，返回最浅的颜色
    if (windSpeed <= colorStops[0].speed) {
      return colorStops[0].color;
    }
    
    // 找到风速所在的区间并进行插值
    for (let i = 0; i < colorStops.length - 1; i++) {
      const stop1 = colorStops[i];
      const stop2 = colorStops[i + 1];
      
      if (windSpeed >= stop1.speed && windSpeed <= stop2.speed) {
        const factor = (windSpeed - stop1.speed) / (stop2.speed - stop1.speed);
        return interpolateColor(stop1.color, stop2.color, factor);
      }
    }
    
    return colorStops[colorStops.length - 1].color;
  };

  // 月份标签
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">
            {loadingProgress.total > 0 
              ? `加载中... ${loadingProgress.current}/${loadingProgress.total} 个月`
              : '加载风速数据中...'}
          </p>
          {loadingProgress.total > 0 && (
            <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
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

  const monthsData = generateCalendarData();

  return (
    <div className="w-full">
      {/* 标题信息 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{location.name}</span>
            <span className="text-slate-400">({location.lat}°N, {location.lon}°E)</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{year}年</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Wind className="w-4 h-4" />
            <span>批次: {batch}</span>
          </div>
          {cacheInfo.used > 0 && (
            <>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <span>
                  {cacheInfo.fetched === 0 
                    ? `✓ 全部缓存 (${cacheInfo.used}月)` 
                    : `✓ 部分缓存 (${cacheInfo.used}/${cacheInfo.used + cacheInfo.fetched}月)`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="重新获取数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          {/* 图例 */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>弱</span>
            <div className="flex gap-0.5">
              {[0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5, 15].map((speed) => (
                <div
                  key={speed}
                  className="w-2.5 h-3 rounded-sm"
                  style={{ backgroundColor: getColor(speed) }}
                  title={`${speed} m/s`}
                ></div>
              ))}
            </div>
            <span>强</span>
          </div>
        </div>
      </div>

      {/* 热力图 */}
      <div className="inline-block">
        <div className="flex gap-1">
          {/* 星期标签列 */}
          <div className="flex flex-col">
            {/* 月份标签占位 */}
            <div className="h-5 mb-2"></div>
            
            {/* 星期标签 - 与图格完全对齐 */}
            <div className="flex flex-col gap-1 text-xs text-slate-500 pr-2">
              <div className="h-3 flex items-center">周日</div>
              <div className="h-3 flex items-center"></div>
              <div className="h-3 flex items-center">周二</div>
              <div className="h-3 flex items-center"></div>
              <div className="h-3 flex items-center">周四</div>
              <div className="h-3 flex items-center"></div>
              <div className="h-3 flex items-center">周六</div>
            </div>
          </div>

          {/* 按月份分组的列 */}
          <div className="flex">
            {monthsData.map((monthData, monthIndex) => (
              <div key={monthData.month} style={{ marginRight: monthIndex < 11 ? '8px' : '0' }}>
                {/* 月份标签 */}
                <div className="text-xs text-slate-500 font-medium mb-2 h-5">
                  {monthData.monthName}
                </div>
                
                {/* 该月的周列 */}
                <div className="flex gap-1">
                  {monthData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((day, dayIndex) => {
                        if (!day.inRange || !day.date) {
                          return (
                            <div
                              key={dayIndex}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: '#f1f5f9' }}
                            ></div>
                          );
                        }

                        const dateStr = day.date.toLocaleDateString('zh-CN', { 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        const windSpeed = day.windSpeed;
                        const tooltipText = windSpeed 
                          ? `${dateStr}\n风速: ${windSpeed.toFixed(2)} m/s`
                          : `${dateStr}\n无数据`;

                        return (
                          <div
                            key={dayIndex}
                            className="w-3 h-3 rounded-sm transition-all hover:scale-125 hover:ring-2 hover:ring-blue-400 cursor-pointer"
                            style={{ backgroundColor: getColor(windSpeed) }}
                            title={tooltipText}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <div className="text-xs text-slate-600 mb-1">平均风速</div>
          <div className="text-lg font-bold text-blue-600">
            {data ? (Object.values(data).reduce((a, b) => a + b, 0) / Object.values(data).length).toFixed(2) : '0.00'} m/s
          </div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100">
          <div className="text-xs text-slate-600 mb-1">最大风速</div>
          <div className="text-lg font-bold text-cyan-600">
            {data ? Math.max(...Object.values(data)).toFixed(2) : '0.00'} m/s
          </div>
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
          <div className="text-xs text-slate-600 mb-1">数据天数</div>
          <div className="text-lg font-bold text-indigo-600">
            {data ? Object.keys(data).length : 0} 天
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindSpeedHeatmap;

