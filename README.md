# Spectra Mission Control

Space station mission control application for managing spacecraft docking schedules. Upload mission logs (txt, pdf, csv) to automatically parse and schedule docking operations.

## Project Structure

```
spectraMissionControl/
├── backend/
│   ├── agents/
│   │   └── parse_agent.py      # AI agent for parsing mission logs
│   ├── app.py                  # Main Flask application
│   ├── docking_logic.py        # Docking scheduling logic
│   ├── docking_validation.py   # Validation rules
│   ├── docking_rules.py        # Port definitions
│   ├── nasa_scraper.py         # NASA blog scraper
│   ├── requirements.txt
│   └── .env.example
└── frontend/                   # Vite React TypeScript
    ├── src/
    │   ├── App.tsx
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

5. Add your API keys to the `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
PORT=8000
```

6. Install Playwright browsers (for scraper):
```bash
playwright install chromium
```

7. Run the backend server:
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

### Mission Scheduling
1. Start both the backend and frontend servers
2. Open your browser to `http://localhost:5173`
3. Upload a mission log file (txt, pdf, or csv)
4. AI parses the file and schedules docking automatically
5. View docking schedule in calendar view

### NASA Scraper
Run the scraper to collect mission data from NASA blog posts:
```bash
cd backend
python nasa_scraper.py
```
Results saved to `backend/output/nasa_mission_data.json`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/process-mission` - Upload and process mission log file
  - Accepts: .txt, .pdf, .csv files
  - Returns: Parsed mission data and docking result
- `GET /api/docking-status` - Get current docking schedule
- `POST /api/clear-schedule` - Clear all scheduled missions

## Tech Stack

- **Backend**: Flask, LangChain, OpenAI, PyPDF2
- **Frontend**: React, TypeScript, Vite
- **Scraper**: Browserbase, Playwright
- **AI**: LangChain with OpenAI for mission log parsing
