import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

# --- 1. Инициализация FastAPI и начального состояния ---

app = FastAPI()

# Хранилище состояния устройств. В реальном приложении это могла бы быть база данных.
device_state = {
    "boiler": {"id": "boiler", "name": "Bosch Gaz 3000 W", "isOn": True, "base_power": 120},
    "pumps": {"id": "pumps", "name": "Циркуляционные насосы", "isOn": True, "base_power": 90},
    "fridge": {"id": "fridge", "name": "Холодильники", "isOn": True, "base_power": 350},
    "inverter": {"id": "inverter", "name": "Инвертор (Холостой ход)", "isOn": True, "base_power": 25},
}

# --- 2. Логика генерации телеметрии ---

def generate_telemetry():
    """
    Генерирует текущий пакет телеметрии на основе стейта.
    Добавляет случайные отклонения к мощности включенных устройств.
    """
    telemetry_data = []
    for device_id, device in device_state.items():
        current_power = 0
        if device["isOn"]:
            # Имитация реального датчика: базовое значение + небольшое отклонение
            fluctuation = random.uniform(-2.0, 2.0)
            current_power = round(device["base_power"] + fluctuation, 2)

        telemetry_data.append({
            "id": device["id"],
            "name": device["name"],
            "isOn": device["isOn"],
            "powerDrawW": current_power,
        })
    return telemetry_data

# --- 3. Асинхронные задачи для WebSocket ---

async def telemetry_sender(websocket: WebSocket):
    """Фоновая задача: каждую секунду отправляет телеметрию клиенту."""
    while True:
        try:
            telemetry = generate_telemetry()
            await websocket.send_text(json.dumps(telemetry))
            await asyncio.sleep(1)
        except WebSocketDisconnect:
            # Если клиент отключился, задача завершается
            print("Клиент отключился. Остановка отправки телеметрии.")
            break

async def command_receiver(websocket: WebSocket):
    """Фоновая задача: слушает команды от клиента."""
    while True:
        try:
            message_text = await websocket.receive_text()
            message_data = json.loads(message_text)

            # Обработка команды на переключение устройства
            if message_data.get("action") == "toggle" and "device_id" in message_data:
                device_id = message_data["device_id"]
                if device_id in device_state:
                    # Инвертируем статус isOn
                    device_state[device_id]["isOn"] = not device_state[device_id]["isOn"]
                    print(f"Переключен статус устройства: {device_id}, новый статус: {device_state[device_id]['isOn']}")
                else:
                    print(f"Получена команда для неизвестного устройства: {device_id}")

        except WebSocketDisconnect:
            print("Клиент отключился. Остановка приема команд.")
            break
        except json.JSONDecodeError:
            print("Получено некорректное JSON-сообщение.")
        except Exception as e:
            print(f"Произошла ошибка при приеме команды: {e}")
            break

# --- 4. WebSocket эндпоинт ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Основной эндпоинт, который запускает фоновые задачи для клиента."""
    await websocket.accept()
    print("Клиент подключен.")

    # Запускаем обе задачи (отправку и прием) параллельно
    sender_task = asyncio.create_task(telemetry_sender(websocket))
    receiver_task = asyncio.create_task(command_receiver(websocket))

    # Ожидаем завершения одной из задач (например, если клиент отключится)
    done, pending = await asyncio.wait(
        [sender_task, receiver_task],
        return_when=asyncio.FIRST_COMPLETED,
    )

    # Отменяем оставшиеся задачи, чтобы избежать "висящих" процессов
    for task in pending:
        task.cancel()
    print("Соединение с клиентом закрыто.")


# --- 5. Блок для запуска сервера ---

if __name__ == "__main__":
    # Запускаем сервер с помощью uvicorn
    # host="0.0.0.0" делает сервер доступным в локальной сети
    uvicorn.run(app, host="0.0.0.0", port=8000)
