import React, { useEffect } from 'react';
import { useDashboardStore } from './store/useDashboardStore';
import { ConsumptionChart } from './components/ConsumptionChart';
import { AnimatedConsumption } from './components/AnimatedConsumption';
import DeviceCard from './components/DeviceCard';
import { PowerChart } from './components/PowerChart';
import { Zap } from 'lucide-react';
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
  // Получаем нужные методы и данные из стора
  const devices = useDashboardStore(state => state.devices);
  const getTotalConsumption = useDashboardStore(state => state.getTotalConsumption);
  const addHistoryPoint = useDashboardStore(state => state.addHistoryPoint);
  const connect = useDashboardStore(state => state.connect); // Получаем метод connect

  // Запускаем подключение к WebSocket при монтировании приложения
  useEffect(() => {
    connect();
  }, [connect]);

  const totalConsumption = getTotalConsumption();
  const TARIFF_UAH_PER_KWH = 4.32;
  const hourlyCost = (totalConsumption / 1000) * TARIFF_UAH_PER_KWH;

  useEffect(() => {
    const intervalId = setInterval(() => {
      addHistoryPoint();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [addHistoryPoint]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-50">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="text-yellow-400" />
              Панель мониторинга
            </h1>
            <ConnectionStatus />
          </div>
          <p className="text-slate-400">Система резервного питания</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-medium text-slate-400 mb-2">Общая нагрузка</h2>
                <AnimatedConsumption value={totalConsumption} />
              </div>
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-4 py-1.5 text-sm font-medium self-start sm:self-center">
                ₴ {hourlyCost.toFixed(2)} / час
              </div>
            </div>
            <ConsumptionChart />
            <div className="bg-slate-900 rounded-3xl p-6">
              <h2 className="text-lg font-medium text-slate-400 mb-2">Нагрузка по устройствам</h2>
              <PowerChart />
            </div>
          </div>
          <aside className="lg:col-span-4 bg-slate-900 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">Устройства</h2>
            <div className="space-y-4">
              {devices.map(device => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
