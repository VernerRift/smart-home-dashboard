import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useDashboardStore } from '../store/useDashboardStore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-slate-800 p-3 text-white shadow-lg border border-slate-700">
        <p className="text-sm text-slate-300">{`Время: ${label}`}</p>
        <p className="text-base font-bold">{`Средняя нагрузка: ${payload[0].value} Вт`}</p>
      </div>
    );
  }
  return null;
};

export const HistoricalChart: React.FC = () => {
  const historicalData = useDashboardStore((state) => state.historicalData);
  const fetchHistoricalData = useDashboardStore((state) => state.fetchHistoricalData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fetchHistoricalData();
    // Обновляем исторические данные раз в минуту
    const interval = setInterval(fetchHistoricalData, 60000);
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchHistoricalData]);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-slate-400">История (24 часа)</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">1 точка = 1 час</span>
      </div>
      <div className="flex-grow w-full">
        {isMounted && (
          <ResponsiveContainer width="99%" height={250} minWidth={1} minHeight={1}>
            <AreaChart
              data={historicalData}
              margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />

              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} W`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                isAnimationActive={true}
                type="monotone"
                dataKey="load"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#histGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
