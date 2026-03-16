import React from 'react';
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

// Кастомный Tooltip в темной теме
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-slate-800 p-3 text-white shadow-lg border border-slate-700">
        <p className="text-sm text-slate-300">{`Время: ${label}`}</p>
        <p className="text-base font-bold">{`Нагрузка: ${payload[0].value} Вт`}</p>
      </div>
    );
  }
  return null;
};

export const ConsumptionChart: React.FC = () => {
  const history = useDashboardStore((state) => state.history);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 h-80 flex flex-col">
      <h2 className="text-lg font-medium text-slate-400 mb-4">История потребления</h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
              isAnimationActive={false} // <-- Отключаем анимацию
              type="monotone"
              dataKey="load"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
