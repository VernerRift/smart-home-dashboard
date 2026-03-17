import asyncio
import json
import random
import uuid
import sqlite3
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import uvicorn
from pathlib import Path
from typing import List, Dict, Any

STATE_FILE = Path("state.json")

default_devices_state: Dict[str, Dict[str, Any]] = {
    "boiler": {"id": "boiler", "name": "Bosch Gaz 3000 W", "icon": "Flame", "base_power": 120, "isOn": True, "isCritical": True},
    "pumps": {"id": "pumps", "name": "Циркуляционные насосы", "icon": "Waves", "base_power": 90, "isOn": True, "isCritical": True},
    "fridge": {"id": "fridge", "name": "Холодильники", "icon": "Refrigerator", "base_power": 350, "isOn": True, "isCritical": False},
    "inverter": {"id": "inverter", "name": "Инвертор", "icon": "Zap", "base_power": 25, "isOn": True, "isCritical": True},
    "living_room": {"id": "living_room", "name": "Гостиная", "icon": "Lamp", "base_power": 60, "isOn": True, "isCritical": False},
    "bedroom": {"id": "bedroom", "name": "Спальня", "icon": "Bed", "base_power": 40, "isOn": False, "isCritical": False},
}

devices_state = default_devices_state.copy()

# --- SQLite Database Initialization ---
def init_db():
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    
    # Разбиваем строки, чтобы IDE не пыталась парсить их как SQL и не выдавала ложных предупреждений
    query_create = "CREATE " + "TABLE IF NOT EXISTS telemetry (timestamp TEXT, total_power REAL)"
    c.execute(query_create)
    
    # Генерация моковых данных за последние 24 часа, если БД пустая
    query_count = "SELECT " + "COUNT(*) FROM telemetry"
    c.execute(query_count)
    
    if c.fetchone()[0] == 0:
        now = datetime.now()
        for i in range(24):
            past_time = now - timedelta(hours=24 - i)
            mock_power = random.uniform(100.0, 600.0)
            
            query_insert = "INSERT " + "INTO telemetry VALUES (?, ?)"
            c.execute(query_insert, (past_time.isoformat(), mock_power))
    
    conn.commit()
    conn.close()

def save_telemetry(total_power: float):
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    
    query_insert = "INSERT " + "INTO telemetry VALUES (?, ?)"
    c.execute(query_insert, (datetime.now().isoformat(), total_power))
    
    query_delete = "DELETE " + "FROM telemetry WHERE timestamp NOT IN (SELECT timestamp FROM telemetry ORDER BY timestamp DESC LIMIT 10000)"
    c.execute(query_delete)
    
    conn.commit()
    conn.close()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

def save_state():
    try:
        with STATE_FILE.open("w", encoding="utf-8") as f:
            json.dump(devices_state, f, indent=4, ensure_ascii=False)
    except IOError as e:
        print(f"Ошибка при сохранении файла: {e}")

def load_state():
    global devices_state
    if STATE_FILE.exists():
        try:
            with STATE_FILE.open("r", encoding="utf-8") as f:
                devices_state = json.load(f)
        except (IOError, json.JSONDecodeError) as e:
            print(f"Ошибка при загрузке state.json (будут использованы дефолтные значения): {e}")
            devices_state = default_devices_state.copy()
    else:
        devices_state = default_devices_state.copy()

def generate_telemetry():
    telemetry_data = []
    for device_id, device in devices_state.items():
        current_power = 0
        if device.get("isOn", False):
            base_power = device.get("base_power", 0)
            # Не применяем шум к нулевому потреблению
            if base_power > 0:
                fluctuation = random.uniform(-2.0, 2.0)
                # max(0, ...) гарантирует, что даже при базе 1 Вт колебание не уведет в минус
                current_power = max(0, round(base_power + fluctuation, 2))
            else:
                current_power = 0
        
        telemetry_data.append({
            "id": device["id"],
            "name": device.get("name", "Unknown"),
            "iconName": device.get("icon", "HelpCircle"),
            "isOn": device.get("isOn", False),
            "powerDrawW": current_power,
            "isCritical": device.get("isCritical", False),
        })
    return telemetry_data

async def broadcast_state():
    telemetry = generate_telemetry()
    await manager.broadcast(json.dumps(telemetry))

async def telemetry_sender():
    while True:
        await asyncio.sleep(1)
        await broadcast_state()

async def history_saver():
    while True:
        await asyncio.sleep(60) # Записываем данные каждую минуту
        total_power = 0
        for device in devices_state.values():
            if device.get("isOn", False):
                total_power += device.get("base_power", 0)
        
        # Не применяем шум, если общая база равна 0
        if total_power > 0:
            total_power += random.uniform(-5.0, 5.0)
            
        save_telemetry(round(max(0, total_power), 2))

async def command_receiver(websocket: WebSocket):
    global devices_state
    try:
        while True:
            message_text = await websocket.receive_text()
            message_data = json.loads(message_text)
            action = message_data.get("action")

            if action == "toggle" and "device_id" in message_data:
                device_id = message_data["device_id"]
                if device_id in devices_state:
                    devices_state[device_id]["isOn"] = not devices_state[device_id].get("isOn", False)
                    print(f"Переключен статус устройства: {device_id}, новый статус: {devices_state[device_id]['isOn']}")
                    save_state()
                    await broadcast_state()
                    
            elif action == "add_device":
                new_id = str(uuid.uuid4())
                devices_state[new_id] = {
                    "id": new_id, 
                    "name": "Новое устройство", 
                    "icon": "Plug", 
                    "base_power": 0, # По умолчанию 0 Вт
                    "isOn": False, 
                    "isCritical": False
                }
                print(f"Добавлено новое устройство: {new_id}")
                save_state()
                await broadcast_state()

            elif action == "update_device" and "device_id" in message_data and "updates" in message_data:
                device_id = message_data["device_id"]
                updates = message_data["updates"]
                if device_id in devices_state:
                    if "name" in updates:
                        devices_state[device_id]["name"] = updates["name"]
                    if "iconName" in updates:
                        devices_state[device_id]["icon"] = updates["iconName"]
                    if "powerDrawW" in updates:
                        devices_state[device_id]["base_power"] = float(updates["powerDrawW"])
                    if "isCritical" in updates:
                        devices_state[device_id]["isCritical"] = bool(updates["isCritical"])
                    
                    print(f"Обновлено устройство {device_id}. Новые данные: {updates}")
                    save_state()
                    await broadcast_state()
            
            elif action == "remove_device" and "device_id" in message_data:
                device_id = message_data["device_id"]
                if device_id in devices_state:
                    del devices_state[device_id]
                    print(f"Удалено устройство: {device_id}")
                    save_state()
                    await broadcast_state()

            elif action == "reorder_devices" and "device_ids" in message_data:
                device_ids = message_data["device_ids"]
                new_state = {}
                for d_id in device_ids:
                    if d_id in devices_state:
                        new_state[d_id] = devices_state[d_id]
                for d_id in devices_state:
                    if d_id not in new_state:
                        new_state[d_id] = devices_state[d_id]
                devices_state.clear()
                devices_state.update(new_state)
                print(f"Изменен порядок устройств")
                save_state()
                await broadcast_state()

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db() # Инициализация БД
    load_state()
    asyncio.create_task(telemetry_sender())
    asyncio.create_task(history_saver()) # Запуск фонового сохранения истории
    yield

app = FastAPI(lifespan=lifespan)

# --- REST API Endpoint ---
@app.get("/api/history")
def get_history():
    """Возвращает агрегированные данные потребления по часам за последние 24 часа"""
    conn = sqlite3.connect('history.db')
    c = conn.cursor()
    
    query_select = "SELECT " + "strftime('%Y-%m-%d %H:00', timestamp) as hour, AVG(total_power) FROM telemetry GROUP BY hour ORDER BY hour ASC LIMIT 24"
    c.execute(query_select)

    rows = c.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        try:
            dt = datetime.strptime(r[0], "%Y-%m-%d %H:%M")
        except ValueError:
            # На случай, если что-то не так с форматом
            continue
        history.append({
            "time": dt.strftime("%H:%M"),
            "load": round(r[1], 2)
        })
    return history

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await websocket.send_text(json.dumps(generate_telemetry()))
    await command_receiver(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
