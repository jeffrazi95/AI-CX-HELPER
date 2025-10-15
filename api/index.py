


from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import openai
from openai import OpenAI
import pytesseract
from PIL import Image
import io
from datetime import datetime
import re

from typing import Optional, List
from sqlmodel import Field, Session, SQLModel, create_engine, select

# Load environment variables from .env file
load_dotenv()

api_app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",  # Allow your frontend to access the backend
    "http://127.0.0.1:3002",  # Allow your frontend to access the backend
]

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = FastAPI()
app.mount("/api", api_app)
app.mount("/images", StaticFiles(directory="public/images"), name="images")

# Configure OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

# --- Database Setup ---
DATABASE_FILE = "api/database.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

# --- Database Models ---
class Agent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)

class AssessmentScenario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    client_message: str
    image_path: Optional[str] = None

class AssessmentResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: str = Field(index=True) # Store agent's string ID
    scenario_id: int = Field(index=True)
    agent_reply: str
    score: int
    feedback_good_points: str # Store as string, parse on frontend
    feedback_needs_improvement: str # Store as string, parse on frontend
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- FastAPI Event Handlers ---
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Populate initial agents if not present
    with Session(engine) as session:
        agent_names = ["sakinah", "dhamirah", "arfiah", "syahir", "melody"]
        for name in agent_names:
            existing_agent = session.exec(select(Agent).where(Agent.name == name)).first()
            if not existing_agent:
                agent = Agent(name=name)
                session.add(agent)
        session.commit()
    # Populate initial scenarios if not present
    with Session(engine) as session:
        if not session.exec(select(AssessmentScenario)).first():
            scenarios_data = [
                {
                    "title": "Frustrated Refund Request",
                    "description": "A client is upset about a delayed refund for a cancelled service.",
                    "client_message": "I cancelled my subscription a week ago and still haven't received my refund! This is unacceptable! Where is my money?!",
                    "image_path": "/images/scenario1.png"
                },
                {
                    "title": "Technical Issue with Urgent Deadline",
                    "description": "A client is facing a critical technical issue that is impacting their business, with an urgent deadline.",
                    "client_message": "My system is down and I can't access my data! This is costing me thousands per hour! I need this fixed NOW!"
                },
                {
                    "title": "Billing Discrepancy",
                    "description": "A client is confused about a recent charge on their bill and believes it's incorrect.",
                    "client_message": "I was charged twice this month! This is wrong, I only signed up for one service. Fix this immediately!"
                },
                {
                    "title": "Feature Request / Complaint",
                    "description": "A client is requesting a new feature and expressing dissatisfaction that it's not already available.",
                    "client_message": "Your software is missing a crucial feature that I need for my workflow. Why isn't this implemented yet? It's very frustrating!"
                },
                {
                    "title": "Positive Feedback / Upsell Opportunity",
                    "description": "A client is giving positive feedback but subtly hints at needing more advanced features.",
                    "client_message": "I love your service, it's been very helpful! I just wish it could also do X, Y, and Z. That would be amazing!"
                }
            ]
            for s_data in scenarios_data:
                scenario = AssessmentScenario(**s_data)
                session.add(scenario)
            session.commit()

# --- API Endpoints ---
class PromptRequest(BaseModel):
    prompt: str
    context: str = ""

async def extract_text_from_image(image_file: UploadFile):
    try:
        image_bytes = await image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error during OCR: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")

@api_app.get("/health")
async def health_check():
    return {"status": "ok"}

@api_app.get("/get_assessment_scenarios", response_model=List[AssessmentScenario])
async def get_assessment_scenarios(week: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(AssessmentScenario)
    if week:
        # Simple logic to vary scenarios by week for demonstration
        # In a real app, scenarios would be explicitly assigned to weeks or generated.
        week_num = int(week.replace("Week ", "")) if week.startswith("Week ") else 0
        if week_num % 2 == 0: # Even weeks get scenarios 1, 3, 5
            query = query.where(AssessmentScenario.id.in_([1, 3, 5]))
        else: # Odd weeks get scenarios 2, 4
            query = query.where(AssessmentScenario.id.in_([2, 4]))
    scenarios = session.exec(query).all()
    return scenarios

@api_app.post("/generate_reply")
async def generate_reply(prompt: str = Form(...), context: str = Form(""), files: List[UploadFile] = File(None)):
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured.")

    extracted_text = ""
    if files:
        for file in files:
            if file.content_type.startswith('image/'):
                extracted_text += await extract_text_from_image(file)
            elif file.content_type == 'application/pdf':
                # Placeholder for PDF text extraction
                extracted_text += "[Text extracted from PDF - not yet implemented]"
            else:
                raise HTTPException(status_code=400, detail="Unsupported file type. Please upload an image or PDF.")

    full_prompt = f"Client's Message: {extracted_text}\nAgent's Context/Question: {prompt}" if extracted_text else f"Client's Message: {prompt}\nAgent's Context/Question: {context}"

    try:
        # Add detailed logging for exceptions
        import traceback
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo", # Or "gpt-4" if you have access
                messages=[
                    {"role": "system", "content": "You are a helpful CX assistant for customer service agents. Your goal is to assist agents in crafting effective replies to client messages. When given a client's message, you must provide 3 distinct, professional, and helpful reply options for the agent. After the reply options, provide an analysis of the client's message tone, an evaluation of solution effectiveness, and offer suggestions for improving the agent's approach. Format your response STRICTLY as follows:\n\nReply Options:\n1. [First reply option]\n2. [Second reply option]\n3. [Third reply option]\n\nFeedback:\nTone: [Tone analysis]\nSolution Effectiveness: [Effectiveness evaluation]\nSuggestions: [Suggestion 1]; [Suggestion 2]; [Suggestion 3]"},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.7,
                n=1 # We will parse the content to get 3 options
            )
        except Exception as e:
            print("Error during OpenAI API call:", e)
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error communicating with OpenAI: {e}")

        llm_content = response.choices[0].message.content

        # --- Parsing the LLM response ---
        # This parsing logic assumes the LLM will return content in a specific format.
        # We'll need to refine the prompt to guide the LLM to output this format reliably.
        
        replies = []
        feedback = {"tone": "N/A", "solutionEffectiveness": "N/A", "suggestions": []}

        # Split content into replies and feedback sections
        parts = llm_content.split("Feedback:")
        if len(parts) > 1:
            replies_section = parts[0].strip()
            feedback_section = "Feedback:" + parts[1].strip()
        else:
            replies_section = llm_content.strip()
            feedback_section = "" # No explicit feedback section

        # Parse replies
        for line in replies_section.split('\n'):
            line = line.strip()
            if line.startswith("1.") or line.startswith("2.") or line.startswith("3."):
                replies.append(line)
            elif line and not replies: # If no numbered options, treat as a single reply
                replies.append(line)
        
        if not replies and replies_section: # Fallback if parsing numbered list fails
            replies.append(replies_section)

        # Parse feedback
        if feedback_section:
            feedback_lines = feedback_section.split('\n')
            for line in feedback_lines:
                if "Tone:" in line:
                    feedback["tone"] = line.split("Tone:")[1].strip()
                elif "Solution Effectiveness:" in line:
                    feedback["solutionEffectiveness"] = line.split("Solution Effectiveness:")[1].strip()
                elif "Suggestions:" in line:
                    suggestions_str = line.split("Suggestions:")[1].strip()
                    feedback["suggestions"] = [s.strip() for s in suggestions_str.split(';') if s.strip()]
        
        # If LLM didn't provide 3 options, we might need to generate more or adjust prompt
        while len(replies) < 3:
            replies.append(f"Generated Option {len(replies) + 1}: (Please refine LLM prompt for more options)")

        return {
            "replies": replies,
            "feedback": feedback
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AssessmentSubmission(BaseModel):
    agent_id: str
    scenario_id: int
    agent_reply: str

# In-memory storage for assessment results (replace with database later)
assessment_results = []

@api_app.post("/submit_assessment")
async def submit_assessment(submission: AssessmentSubmission, session: Session = Depends(get_session)):
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured.")

    try:
        # Fetch the scenario details from the database
        scenario = session.exec(select(AssessmentScenario).where(AssessmentScenario.id == submission.scenario_id)).first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found.")

        # AI Analysis of Agent's Reply
        assessment_prompt = f"You are an expert CX assessor. Evaluate the following agent's reply to a client scenario. Provide a score out of 100, what was good, and what needs improvement.\n\nScenario: {scenario.client_message}\nAgent's Reply: {submission.agent_reply}\n\nFormat your response STRICTLY as follows:\nScore: [Score out of 100]\nGood Points: [Point 1]; [Point 2]\nNeeds Improvement: [Improvement 1]; [Improvement 2]"

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert CX assessor."},
                {"role": "user", "content": assessment_prompt}
            ],
            temperature=0.5,
        )

        llm_content = response.choices[0].message.content

        # Parse LLM response for score and feedback
        score = 0
        good_points = []
        needs_improvement = []

        # Use regex to find score
        score_match = re.search(r"Score:\s*(\d+)", llm_content)
        if score_match: score = int(score_match.group(1))

        # Use regex to find Good Points
        good_points_match = re.search(r"Good Points:\s*(.*?)(?:\nNeeds Improvement:|$)", llm_content, re.DOTALL)
        if good_points_match:
            good_points_str = good_points_match.group(1).strip()
            good_points = [p.strip() for p in good_points_str.split(';') if p.strip()]

        # Use regex to find Needs Improvement
        needs_improvement_match = re.search(r"Needs Improvement:\s*(.*)", llm_content, re.DOTALL)
        if needs_improvement_match:
            needs_improvement_str = needs_improvement_match.group(1).strip()
            needs_improvement = [p.strip() for p in needs_improvement_str.split(';') if p.strip()]

        # Save result to database
        assessment_result_db = AssessmentResult(
            agent_id=submission.agent_id,
            scenario_id=submission.scenario_id,
            agent_reply=submission.agent_reply,
            score=score,
            feedback_good_points="; ".join(good_points),
            feedback_needs_improvement="; ".join(needs_improvement),
        )
        session.add(assessment_result_db)
        session.commit()
        session.refresh(assessment_result_db)

        return {"message": "Assessment submitted and analyzed successfully!", "result": {
            "agent_id": assessment_result_db.agent_id,
            "scenario_id": assessment_result_db.scenario_id,
            "agent_reply": assessment_result_db.agent_reply,
            "score": assessment_result_db.score,
            "feedback": {"good_points": good_points, "needs_improvement": needs_improvement},
            "timestamp": assessment_result_db.timestamp.isoformat()
        }}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Assessment submission failed: {e}")

@api_app.get("/get_assessment_results", response_model=List[AssessmentResult])
async def get_assessment_results(agent_id: Optional[str] = None, week: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(AssessmentResult)
    if agent_id:
        query = query.where(AssessmentResult.agent_id == agent_id)
    if week:
        # For now, we'll assume week is stored in a way that allows direct filtering
        # In a real app, you might derive week from timestamp or have a dedicated field
        pass # Placeholder for actual week filtering logic
    results = session.exec(query).all()
    return results

@api_app.get("/get_assessment_weeks")
async def get_assessment_weeks():
    # Mock list of weeks for assessment
    return [f"Week {i}" for i in range(1, 13)]

@api_app.post("/ingest_guideline")
async def ingest_guideline(file: UploadFile = File(...)):
    # This is a placeholder for actual PDF processing and storage
    # In a real scenario, you'd save the PDF, extract text, and process it for the AI's knowledge base.
    return {"message": f"Guideline {file.filename} ingested successfully (mock)."}