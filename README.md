# AI CX Helper

An AI-powered training and assessment tool for customer service agents.

## Features

- **Assist Mode**: Get AI-powered suggestions for customer service responses
- **Assessment Mode**: Practice with realistic customer scenarios and get scored feedback
- **Assessment Dashboard**: View historical performance across different agents and scenarios
- **Guideline Manager**: Upload and manage customer service guidelines

## Tech Stack

- **Frontend**: React 19, Material-UI, React Router
- **Backend**: Python FastAPI, SQLite, OpenAI API
- **Development**: Concurrently runs both frontend and backend

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Setup Instructions

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
pip install -r api/requirements.txt
# or if you're using pip3:
pip3 install -r api/requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. Run the Application

Start both frontend and backend servers:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000

### 5. Access the Application

Open your browser and navigate to:
- **Main App**: http://localhost:3000
- **API Docs**: http://127.0.0.1:8000/api/docs

## Usage

1. **Select an Agent**: Choose from 5 agents (Sakinah, Dhamirah, Arfiah, Syahir, Melody)
2. **Choose Mode**:
   - **Assist Me**: Get real-time AI suggestions for customer interactions
   - **Do Assessment**: Practice with scenarios and receive scored feedback
3. **View Dashboard**: Check performance metrics and improvement areas

## Agents

- Sakinah
- Dhamirah
- Arfiah
- Syahir
- Melody

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/get_assessment_weeks` - Get available assessment weeks
- `GET /api/get_assessment_scenarios` - Get assessment scenarios
- `POST /api/generate_reply` - Generate AI-powered responses
- `POST /api/submit_assessment` - Submit assessment results
- `GET /api/get_assessment_results` - Get historical results
- `POST /api/ingest_guideline` - Upload guideline documents

## Project Structure

```
ai-cx-helper/
├── api/                          # Backend (Python FastAPI)
│   ├── index.py                  # Main API server
│   ├── database.db              # SQLite database
│   └── requirements.txt         # Python dependencies
├── src/                         # Frontend (React)
│   ├── App.js                   # Main app component
│   ├── ModeSelectionPage.js     # Landing page
│   ├── AICXHelperInterface.js   # Assist mode interface
│   ├── AssessmentPage.js        # Assessment interface
│   ├── AssessmentDashboardPage.js # Dashboard
│   └── GuidelineManager.js      # Guideline management
├── public/                      # Static assets
├── package.json                 # Node.js dependencies
├── .env                         # Environment variables (not included)
└── README.md                    # This file
```

## Troubleshooting

### Python module not found
Make sure you've installed Python dependencies:
```bash
pip install -r api/requirements.txt
```

### OpenAI API Error
Verify your API key is correctly set in `.env` file and has sufficient credits.

### Port already in use
If port 3000 or 8000 is already in use, you can:
- Stop other applications using those ports
- Or modify the ports in `package.json` and `api/index.py`

### Database issues
If you encounter database errors, delete `api/database.db` and restart the server. It will be recreated automatically.

## Notes

- The database is automatically created on first startup
- Assessment scenarios are pre-populated with 5 default scenarios
- The app uses SQLite for simplicity (stored in `api/database.db`)
- Frontend runs on port 3000, backend on port 8000

## Support

For issues or questions, contact the project maintainer.
