import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import whisper
import os
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
model = whisper.load_model("base")

@app.get('/')
def index():
    logger.info("Accessed index route")
    return {"message": "Aapka swagat hai humare route me"}

@app.post("/convert")
async def convert(file: UploadFile = File(...), id: str = Query(..., description="Unique identifier for the video")):
    logger.info(f"Received request to convert file with ID: {id}")
    try:
        # Step 1: Save the uploaded file
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb") as buffer:
            buffer.write(file.file.read())
        logger.info(f"File saved at {file_location}")

        # Step 2: Transcribe using Whisper
        logger.info(f"Starting transcription for file: {file_location}")
        result = model.transcribe(file_location)
        logger.info("Transcription completed")

        # Clean up the file
        os.remove(file_location)
        logger.info(f"Temporary file {file_location} deleted")

        # Return both the transcribed text and the ID
        return {"id": id, "text": result["text"]}
    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host='127.0.0.1', port=8000)
