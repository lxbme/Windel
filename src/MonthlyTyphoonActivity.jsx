import React, { useState, useEffect } from 'react';
import { Wind, AlertCircle, Calendar } from 'lucide-react';

/**
 * 本月台风活动组件
 * 展示当月所有活跃台风的统计信息
 */
const MonthlyTyphoonActivity = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typhoonData, setTyphoonData] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  // 获取本月日期范围
  const getThisMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    // 本月第一天
    const firstDay = new Date(year, month, 1);
    // 本月最后一天或今天（取较早的）
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const endDate = lastDay > today ? today : lastDay;
    
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    };
    
    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(endDate),
      monthName: `${year}年${month + 1}月`
    };
  };

  // 根据风速获取台风类别
  const getTyphoonCategory = (wind) => {
    if (wind >= 51) return { code: 'SuperTY', name: '超强台风', color: '#8b5cf6' };
    if (wind >= 42) return { code: 'STY', name: '强台风', color: '#ef4444' };
    if (wind >= 33) return { code: 'TY', name: '台风', color: '#f97316' };
    if (wind >= 25) return { code: 'STS', name: '强热带风暴', color: '#eab308' };
    if (wind >= 18) return { code: 'TS', name: '热带风暴', color: '#84cc16' };
    if (wind >= 11) return { code: 'TD', name: '热带低压', color: '#22c55e' };
    return { code: 'UNKNOWN', name: '未知', color: '#94a3b8' };
  };

  // 渲染台风等级SVG图标
  const renderTyphoonIcon = (code, index = 0) => {
    const size = 40; // 图标大小
    const viewBox = "0 0 100 100";
    const uniqueId = `typhoon-${code}-${index}-${Date.now()}`;
    
    switch (code) {
      case 'TD': // 热带低压
        return (
          <svg width={size} height={size} viewBox={viewBox} className="flex-shrink-0">
            <path d="M 30 50 A 20 20 0 0 1 70 50" fill="none" stroke="#4DD0E1" strokeWidth="8" strokeLinecap="round" transform="rotate(25 50 50)"/>
            <path d="M 70 50 A 20 20 0 0 1 30 50" fill="none" stroke="#4DD0E1" strokeWidth="8" strokeLinecap="round" transform="rotate(25 50 50)"/>
            <circle cx="20" cy="35" r="4" fill="#4DD0E1" opacity="0.6"/>
            <circle cx="80" cy="65" r="4" fill="#4DD0E1" opacity="0.6"/>
          </svg>
        );
      
      case 'TS': // 热带风暴
        return (
          <svg width={size} height={size} viewBox={viewBox} className="flex-shrink-0">
            <g transform="translate(50,50)">
              <path d="M0,-38 A38,38 0 0,1 32.9,19 A20,20 0 0,0 0,-15 A20,20 0 0,0 -32.9,19 A38,38 0 0,1 0,-38 Z" fill="#FFD600" transform="rotate(0)"/>
              <path d="M0,-38 A38,38 0 0,1 32.9,19 A20,20 0 0,0 0,-15 A20,20 0 0,0 -32.9,19 A38,38 0 0,1 0,-38 Z" fill="#FFD600" transform="rotate(120)"/>
              <path d="M0,-38 A38,38 0 0,1 32.9,19 A20,20 0 0,0 0,-15 A20,20 0 0,0 -32.9,19 A38,38 0 0,1 0,-38 Z" fill="#FFD600" transform="rotate(240)"/>
            </g>
          </svg>
        );
      
      case 'TY': // 台风
        return (
          <svg width={size} height={size} viewBox={viewBox} className="flex-shrink-0">
            <g fill="#FF6D00">
              <path d="M50 50 m-6 -38 a 6 6 0 0 1 12 0 l -4 38 a 2 2 0 0 1 -4 0 z" transform="rotate(0 50 50) translate(0 -5)"/>
              <path d="M50 50 m-6 -38 a 6 6 0 0 1 12 0 l -4 38 a 2 2 0 0 1 -4 0 z" transform="rotate(90 50 50) translate(0 -5)"/>
              <path d="M50 50 m-6 -38 a 6 6 0 0 1 12 0 l -4 38 a 2 2 0 0 1 -4 0 z" transform="rotate(180 50 50) translate(0 -5)"/>
              <path d="M50 50 m-6 -38 a 6 6 0 0 1 12 0 l -4 38 a 2 2 0 0 1 -4 0 z" transform="rotate(270 50 50) translate(0 -5)"/>
              <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#FF6D00" strokeWidth="6" strokeLinecap="round"/>
              <path d="M 50 90 A 40 40 0 0 1 10 50" fill="none" stroke="#FF6D00" strokeWidth="6" strokeLinecap="round"/>
            </g>
            <circle cx="50" cy="50" r="5" fill="white"/>
          </svg>
        );
      
      case 'STY': // 强台风
        return (
          <svg width={size} height={size} viewBox={viewBox} className="flex-shrink-0">
            <defs>
              <path id={`blade-${uniqueId}`} d="M50 50 Q 70 20 85 30 L 90 40 Q 60 40 50 50" fill="#D50000" />
            </defs>
            <g>
              <use href={`#blade-${uniqueId}`} transform="rotate(0 50 50)"/>
              <use href={`#blade-${uniqueId}`} transform="rotate(60 50 50)"/>
              <use href={`#blade-${uniqueId}`} transform="rotate(120 50 50)"/>
              <use href={`#blade-${uniqueId}`} transform="rotate(180 50 50)"/>
              <use href={`#blade-${uniqueId}`} transform="rotate(240 50 50)"/>
              <use href={`#blade-${uniqueId}`} transform="rotate(300 50 50)"/>
            </g>
            <path d="M 50 5 L 55 15 L 45 15 Z" fill="#D50000" transform="rotate(15 50 50)"/>
            <path d="M 50 5 L 55 15 L 45 15 Z" fill="#D50000" transform="rotate(135 50 50)"/>
            <path d="M 50 5 L 55 15 L 45 15 Z" fill="#D50000" transform="rotate(255 50 50)"/>
            <circle cx="50" cy="50" r="10" fill="white"/>
          </svg>
        );
      
      case 'SuperTY': // 超强台风
        return (
          <svg width={size} height={size} viewBox={viewBox} className="flex-shrink-0">
            <defs>
              <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#4A148C",stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#311B92",stopOpacity:1}} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill={`url(#grad-${uniqueId})`}/>
            <path d="M 50 50 Q 80 20 95 40" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
            <path d="M 50 50 Q 20 80 5 60" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
            <path d="M 50 50 Q 80 80 60 95" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
            <path d="M 50 50 Q 20 20 40 5" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
            <circle cx="50" cy="50" r="14" fill="#D50000" stroke="white" strokeWidth="3"/>
            <circle cx="50" cy="50" r="4" fill="white"/>
            <path d="M 95 50 L 85 45 L 85 55 Z" fill="#311B92" transform="rotate(45 50 50)"/>
            <path d="M 5 50 L 15 45 L 15 55 Z" fill="#311B92" transform="rotate(45 50 50)"/>
          </svg>
        );
      
      default:
        return (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm bg-slate-400">
            {code}
          </div>
        );
    }
  };

  // 获取台风数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setFromCache(false);

        const { startDate, endDate, monthName } = getThisMonthRange();
        const batch = '12z';
        
        // 生成缓存键
        const cacheKey = `monthly_typhoon_${startDate}_${endDate}_${batch}`;
        const cacheTimestampKey = `${cacheKey}_timestamp`;
        
        // 尝试从缓存读取
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
        
        // 检查缓存是否有效（6小时）
        const cacheValidDuration = 6 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < cacheValidDuration) {
          // 使用缓存数据
          console.log('使用本月台风活动缓存数据');
          const data = JSON.parse(cachedData);
          setTyphoonData(data);
          setFromCache(true);
          setLoading(false);
          return;
        }
        
        // 缓存无效或不存在，从服务器获取
        console.log('从服务器获取本月台风活动数据');
        
        // 生成日期数组
        const dates = [];
        const start = new Date(parseInt(startDate.substring(0, 4)), parseInt(startDate.substring(4, 6)) - 1, parseInt(startDate.substring(6, 8)));
        const end = new Date(parseInt(endDate.substring(0, 4)), parseInt(endDate.substring(4, 6)) - 1, parseInt(endDate.substring(6, 8)));
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
          dates.push(dateStr);
        }
        
        // 并发请求所有日期的台风数据
        const promises = dates.map(async (date) => {
          try {
            const url = `/typhoon?date=${date}&batch=${batch}`;
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const result = await response.json();
            if (!result.now || result.now.length === 0) return null;
            
            return {
              date,
              typhoons: result.now.map(t => ({
                name: t.name || 'UNNAMED',
                lat: parseFloat(t.cma_lat || 0),
                lon: parseFloat(t.cma_lon || 0),
                wind: parseFloat(t.cma_wind || 0),
                pressure: parseFloat(t.cma_pres || 0)
              }))
            };
          } catch (err) {
            console.error(`获取${date}台风数据失败:`, err);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        // 统计台风信息
        const typhoonMap = new Map();
        
        validResults.forEach(dayData => {
          dayData.typhoons.forEach(typhoon => {
            if (!typhoonMap.has(typhoon.name)) {
              typhoonMap.set(typhoon.name, {
                name: typhoon.name,
                maxWind: typhoon.wind,
                minPressure: typhoon.pressure,
                activeDays: 1,
                firstSeen: dayData.date,
                lastSeen: dayData.date
              });
            } else {
              const existing = typhoonMap.get(typhoon.name);
              existing.maxWind = Math.max(existing.maxWind, typhoon.wind);
              existing.minPressure = Math.min(existing.minPressure, typhoon.pressure);
              existing.activeDays++;
              existing.lastSeen = dayData.date;
            }
          });
        });
        
        const typhoonList = Array.from(typhoonMap.values())
          .sort((a, b) => b.maxWind - a.maxWind);
        
        const data = {
          monthName,
          totalTyphoons: typhoonList.length,
          typhoons: typhoonList
        };
        
        setTyphoonData(data);
        
        // 保存到缓存
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheTimestampKey, now.toString());
          console.log('本月台风活动数据已缓存');
        } catch (e) {
          console.warn('缓存保存失败:', e);
        }

      } catch (err) {
        setError(`网络错误: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">加载台风数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!typhoonData || typhoonData.totalTyphoons === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Wind className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">本月无台风活动</h3>
        <p className="text-sm text-slate-500">{typhoonData?.monthName || '当月'}暂无活跃台风</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* 缓存指示 */}
      {fromCache && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md z-10">
          <span>✓ 使用缓存</span>
        </div>
      )}
      
      {/* 月份标题 */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">{typhoonData.monthName}</span>
        <span className="text-xs text-slate-500">· {typhoonData.totalTyphoons}个台风</span>
      </div>

      {/* 台风列表 */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
        {typhoonData.typhoons.map((typhoon, index) => {
          const category = getTyphoonCategory(typhoon.maxWind);
          
          return (
            <div
              key={index}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {renderTyphoonIcon(category.code, index)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{typhoon.name}</h4>
                    <span className="text-[10px] text-slate-400">{category.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-700 font-mono">{typhoon.maxWind.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">m/s</span></div>
                  <div className="text-[10px] text-slate-400 font-mono">{typhoon.minPressure.toFixed(0)} hPa</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>
                    {typhoon.firstSeen.substring(4, 6)}/{typhoon.firstSeen.substring(6, 8)}
                    <span className="mx-1">-</span>
                    {typhoon.lastSeen.substring(4, 6)}/{typhoon.lastSeen.substring(6, 8)}
                  </span>
                </div>
                <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">活跃 {typhoon.activeDays} 天</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyTyphoonActivity;

