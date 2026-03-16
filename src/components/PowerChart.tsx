import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStore } from '../store/useDashboardStore';
import type { Device } from '../store/useDashboardStore';

import type { LucideIcon } from 'lucide-react';
import { Flame, Refrigerator, Waves, Lamp, Bed, Zap, Activity, Plug } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Flame,
  Refrigerator,
  Waves,
  Lamp,
  Bed,
  Zap,
  Activity,
};

const CustomAxisTick = (props: any) => {
  const { x, y, payload, devices } = props;
  const device = devices.find((d: Device) => d.name === payload.value);
  const iconName = device?.iconName || '';
  const IconComponent = iconMap[iconName] || Plug;

  return (
    <g transform={`translate(${x - 12},${y + 10})`}>
      <IconComponent className="text-gray-400" size={24} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-gray-800 p-3 text-white shadow-lg border border-gray-700">
        <p className="text-sm font-bold text-gray-100">{payload[0].payload.name}</p>
        <p className="text-xs text-blue-400">{`Потребление: ${payload[0].value} Вт`}</p>
      </div>
    );
  }
  return null;
};

export const PowerChart: React.FC = () => {
  const devices = useDashboardStore((state) => state.devices);

  const chartData = useMemo(() => {
    return devices
      .filter((device) => device.isOn)
      .sort((a, b) => b.powerDrawW - a.powerDrawW);
  }, [devices]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400">Вся нагрузка отключена</p>
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 10,
            left: -10,
            bottom: 20,
          }}
        >
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<CustomAxisTick devices={devices} />}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value} W`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
          />
          <Bar dataKey="powerDrawW" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.id}`}
                fill={entry.isCritical ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
