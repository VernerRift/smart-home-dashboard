# Smart Home Dashboard 🏠⚡

A modern dashboard for smart home management and real-time energy monitoring. The project consists of an interactive React frontend and a fast asynchronous FastAPI backend.

## ✨ Key Features

- **Real-time telemetry:** Instant energy consumption data updates via WebSockets.
- **Device management:** Turn devices on/off, add new ones, edit, and delete devices directly from the UI.
- **Consumption history:** Collection and aggregation of energy consumption data (SQLite) accessible via REST API.
- **State synchronization:** Current device states are saved to `state.json` and restored after backend restarts.
- **Smooth UI animations:** Custom hooks for animating power numerical values.

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — blazing fast bundler
- **Tailwind CSS** — for styling
- **Lucide React** — beautiful icon collection

### Backend
- **Python 3** + **FastAPI**
- **WebSockets** — for real-time bidirectional communication
- **SQLite** — for historical data storage
- **Uvicorn** — ASGI server

---

## 🚀 How to Run the Project

The project is divided into two parts: the client (Frontend) and the server (Backend). You need to run both for the application to work fully.

### 1. Running the Backend (FastAPI)

Ensure you have Python installed (version 3.8 or higher).

Navigate to the backend folder (if it's separated) or the project root where `main.py` is located:

```bash
# It is recommended to create a virtual environment
python -m venv venv
source venv/bin/activate  # For Linux/macOS
venv\Scripts\activate     # For Windows

# Install dependencies
pip install fastapi uvicorn

# Start the server
python main.py
# The server will start at http://localhost:8000
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
