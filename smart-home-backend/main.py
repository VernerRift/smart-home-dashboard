import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from pathlib import Path

app = FastAPI()

STATE_FILE = Path("state.json")


devices_state = {
    "boiler": {"id": "boiler", "name": "Bosch Gaz 3000 W", "isOn": True, "base_power": 120},
    "pumps": {"id": "pumps", "name": "Циркуляционные насосы", "isOn": True, "base_power": 90},
    "fridge": {"id": "fridge", "name": "Холодильники", "isOn": True, "base_power": 350},
    "inverter": {"id": "inverter", "name": "Инвертор", "isOn": True, "base_power": 25},
    "living_room": {"id": "living_room", "name": "Гостиная", "isOn": True, "base_power": 60},
    "bedroom": {"id": "bedroom", "name": "Спальня", "isOn": False, "base_power": 40},
}

def save_state():
    print("Сохранение состояния в файл...")
    try:
        state_to_save = {
            device_id: {"isOn": data["isOn"]} for device_id, data in devices_state.items()
        }
        with STATE_FILE.open("w", encoding="utf-8") as f:
            json.dump(state_to_save, f, indent=4, ensure_ascii=False)
        print("Состояние успешно сохранено.")
    except IOError as e:
        print(f"Ошибка при сохранении файла: {e}")

def load_state():
    global devices_state
    if STATE_FILE.exists():
        print("Найден файл state.json, загрузка состояния...")
        try:
            with STATE_FILE.open("r", encoding="utf-8") as f:
                saved_state = json.load(f)
            
            for device_id, data in saved_state.items():
                if device_id in devices_state and "isOn" in data:
                    devices_state[device_id]["isOn"] = data["isOn"]
            print("Состояние успешно загружено.")
        except (IOError, json.JSONDecodeError) as e:
            print(f"Ошибка при загрузке или парсинге файла состояния: {e}")
    else:
        print("Файл state.json не найден, используется состояние по умолчанию.")

def generate_telemetry():
    telemetry_data = []
    for device_id, device in devices_state.items():
        current_power = 0
        if device["isOn"]:
            fluctuation = random.uniform(-2.0, 2.0)
            current_power = round(device["base_power"] + fluctuation, 2)
        
        telemetry_data.append({
            "id": device["id"],
            "name": device["name"],
            "isOn": device["isOn"],
            "powerDrawW": current_power,
        })
    return telemetry_data

async def telemetry_sender(websocket: WebSocket):
    while True:
        try:
            telemetry = generate_telemetry()
            await websocket.send_text(json.dumps(telemetry))
            await asyncio.sleep(1)
        except WebSocketDisconnect:
            print("Клиент отключился. Остановка отправки телеметрии.")
            break

async def command_receiver(websocket: WebSocket):
    while True:
        try:
            message_text = await websocket.receive_text()
            message_data = json.loads(message_text)

            if message_data.get("action") == "toggle" and "device_id" in message_data:
                device_id = message_data["device_id"]
                if device_id in devices_state:
                    devices_state[device_id]["isOn"] = not devices_state[device_id]["isOn"]
                    print(f"Переключен статус устройства: {device_id}, новый статус: {devices_state[device_id]['isOn']}")
                    save_state()
                else:
                    print(f"Получена команда для неизвестного устройства: {device_id}")

        except WebSocketDisconnect:
            print("Клиент отключился. Остановка приема команд.")
            break
        except (json.JSONDecodeError, TypeError):
            print("Получено некорректное JSON-сообщение.")
        except Exception as e:
            print(f"Произошла ошибка при приеме команды: {e}")
            break

@app.on_event("startup")
async def startup_event():
    load_state()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Клиент подключен.")
    sender_task = asyncio.create_task(telemetry_sender(websocket))
    receiver_task = asyncio.create_task(command_receiver(websocket))
    done, pending = await asyncio.wait(
        [sender_task, receiver_task],
        return_when=asyncio.FIRST_COMPLETED,
    )
    for task in pending:
        task.cancel()
    print("Соединение с клиентом закрыто.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
