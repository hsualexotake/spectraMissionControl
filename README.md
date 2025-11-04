# Spectra Mission Control

A simple full-stack application with Flask/Python backend and TypeScript/React frontend, featuring LangChain AI agents.

## Project Structure

```
spectraMissionControl/
├── backend/              # Flask Python backend
│   ├── agents/          # AI agents
│   │   ├── __init__.py
│   │   └── demo_agent.py    # Text summarization demo
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # Environment variables template
└── frontend/            # Vite React TypeScript frontend
    ├── src/
    │   ├── App.tsx      # Main app component
    │   └── ...
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:
```bash
cp .env.example .env
```

5. Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
```

6. Run the backend server:
```bash
python app.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Start both the backend and frontend servers
2. Open your browser to `http://localhost:5173`
3. Enter text in the textarea and click "Summarize" to test the demo agent

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/agent` - Text summarization endpoint
  - Request body: `{ "message": "text to summarize" }`
  - Response: `{ "message": "summary", "note": "Demo agent - Summarized by ChatGPT" }`

## Tech Stack

- **Backend**: Flask, LangChain, OpenAI
- **Frontend**: React, TypeScript, Vite
- **AI**: LangChain with OpenAI GPT-3.5-turbo
