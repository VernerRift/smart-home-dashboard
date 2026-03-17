# Smart Home Dashboard 🏠⚡

Современный дашборд для управления умным домом и мониторинга энергопотребления в реальном времени. Проект состоит из интерактивного фронтенда на React и быстрого асинхронного бэкенда на FastAPI.

## ✨ Ключевые возможности

- **Реалтайм телеметрия:** Мгновенное обновление данных о потреблении энергии через WebSockets.
- **Управление устройствами:** Включение/выключение, добавление новых, редактирование и удаление устройств прямо из интерфейса.
- **История потребления:** Сбор и агрегация данных об энергопотреблении (SQLite) с доступом через REST API.
- **Синхронизация состояния:** Сохранение текущего состояния устройств в `state.json` и восстановление после перезапуска бэкенда.
- **Плавные UI-анимации:** Кастомные хуки для анимированного изменения числовых значений мощности.

## 🛠 Стек технологий

### Frontend
- **React 18** + **TypeScript**
- **Vite** — невероятно быстрый сборщик
- **Tailwind CSS** — для стилизации
- **Lucide React** — коллекция красивых иконок

### Backend
- **Python 3** + **FastAPI**
- **WebSockets** — для двусторонней связи в реальном времени
- **SQLite** — для хранения исторической статистики
- **Uvicorn** — ASGI-сервер

---

## 🚀 Как запустить проект

Проект разделен на две части: клиентскую (Frontend) и серверную (Backend). Для полноценной работы необходимо запустить обе.

### 1. Запуск Backend (FastAPI)

Убедитесь, что у вас установлен Python (версии 3.8 или выше).

Перейдите в папку с бэкендом (если она выделена отдельно) или в корень проекта, где лежит `main.py`:

```bash
# Рекомендуется создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Для Linux/macOS
venv\Scripts\activate     # Для Windows

# Установка зависимостей
pip install fastapi uvicorn

# Запуск сервера
python main.py
# Сервер запустится на http://localhost:8000
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
