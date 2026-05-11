import os
import io
import torch
import re
from PIL import Image
from transformers import VisionEncoderDecoderModel, DonutProcessor, pipeline
from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn

app = FastAPI(title="Medical OCR API")

# Dynamically determine the current directory and construct the relative path to the model folder
current_dir = os.path.dirname(os.path.abspath(__file__))
donut_model_path = os.path.join(current_dir, "model")

processor = None
donut_model = None
classifier = None
device = "cuda" if torch.cuda.is_available() else "cpu"

try:
    # Load the processor and model from the trained model directory
    processor = DonutProcessor.from_pretrained(donut_model_path)
    donut_model = VisionEncoderDecoderModel.from_pretrained(donut_model_path)
    donut_model.to(device)
    donut_model.eval()
except Exception as e:
    print(f"Error loading Donut model: {e}")

try:
    # Initialize zero-shot classification pipeline
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=0 if device == "cuda" else -1)
except Exception as e:
    print(f"Error initializing Zero-Shot Classifier: {e}")

candidate_labels = ["medical prescription", "not medical prescription"]

def extract_text_from_image(image):
    """
    Extracts text from an image using the Donut OCR model.
    """
    if not processor or not donut_model:
        return "OCR model not loaded."
    
    image = image.convert("RGB")  # Ensure RGB, as trained
    encoding = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        generated_ids = donut_model.generate(
            encoding.pixel_values, 
            max_length=512, 
            num_beams=1,
            early_stopping=True,
            decoder_start_token_id=processor.tokenizer.convert_tokens_to_ids("<s_ocr>")
        )
    generated_text = processor.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
    return generated_text

def extract_medicines(text):
    """
    Extract medicines using a simple heuristic from the OCR text.
    """
    text_lower = text.lower()
    known_medicines = ["doliprane", "amoxicilline", "paracetamol", "brufen", "ibuprofene", "augmentin"]
    found = []
    for med in known_medicines:
        if med in text_lower:
            found.append(med)
    return list(set(found))

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    print(f"Received OCR request for file: {file.filename}")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        extracted_text = extract_text_from_image(image)
        print(f"Extracted Text: {extracted_text}")
        
        medicines = extract_medicines(extracted_text)
        print(f"Extracted Medicines: {medicines}")
        
        return {
            "text": extracted_text,
            "medicines": medicines
        }
    except Exception as e:
        print(f"OCR Processing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
