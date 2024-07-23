import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
import whisper
import os

app = FastAPI()
model = whisper.load_model("base")

@app.get('/')
def index():
    return {"message": "Aapka swagat hai humare route me"}

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
import whisper
import os

app = FastAPI()
model = whisper.load_model("base")

@app.post("/convert")
async def convert(file: UploadFile = File(...), id: str = Query(..., description="Unique identifier for the video")):
    try:
        # Step 1: Save the uploaded file
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb") as buffer:
            buffer.write(file.file.read())
        
        # Step 2: Transcribe using Whisper
        result = model.transcribe(file_location)
        
        # Clean up the file
        os.remove(file_location)
        
        # Return both the transcribed text and the ID
        return {"id": id, "text": result["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
# uvicorn main:app --reload