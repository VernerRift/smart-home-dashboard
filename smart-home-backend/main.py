import asyncio
import json
import random
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from pathlib import Path
from typing import List

app = FastAPI()
STATE_FILE = Path("state.json")

# Полное начальное состояние
default_devices_state = {
    "boiler": {"id": "boiler", "name": "Bosch Gaz 3000 W", "icon": "Flame", "base_power": 120, "isOn": True, "isCritical": True},
    "pumps": {"id": "pumps", "name": "Циркуляционные насосы", "icon": "Waves", "base_power": 90, "isOn": True, "isCritical": True},
    "fridge": {"id": "fridge", "name": "Холодильники", "icon": "Refrigerator", "base_power": 350, "isOn": True, "isCritical": False},
    "inverter": {"id": "inverter", "name": "Инвертор", "icon": "Zap", "base_power": 25, "isOn": True, "isCritical": True},
    "living_room": {"id": "living_room", "name": "Гостиная", "icon": "Lamp", "base_power": 60, "isOn": True, "isCritical": False},
    "bedroom": {"id": "bedroom", "name": "Спальня", "icon": "Bed", "base_power": 40, "isOn": False, "isCritical": False},
}

devices_state = default_devices_state.copy()

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
    print("Сохранение состояния в файл...")
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
            devices_state = default_devices_state.copy()
    else:
        devices_state = default_devices_state.copy()

def generate_telemetry():
    telemetry_data = []
    for device_id, device in devices_state.items():
        current_power = 0
        if device.get("isOn", False):
            fluctuation = random.uniform(-2.0, 2.0)
            current_power = round(device.get("base_power", 0) + fluctuation, 2)
        
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
                    save_state()
                    await broadcast_state()
                    
            elif action == "add_device":
                new_id = str(uuid.uuid4())
                devices_state[new_id] = {
                    "id": new_id, 
                    "name": "Новое устройство", 
                    "icon": "Plug", 
                    "base_power": 10, 
                    "isOn": False, 
                    "isCritical": False
                }
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
                    save_state()
                    await broadcast_state()
            
            elif action == "remove_device" and "device_id" in message_data:
                device_id = message_data["device_id"]
                if device_id in devices_state:
                    del devices_state[device_id]
                    save_state()
                    await broadcast_state()

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    load_state()
    asyncio.create_task(telemetry_sender())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await websocket.send_text(json.dumps(generate_telemetry()))
    await command_receiver(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
