from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import io
import torch
from PIL import Image
from transformers import VisionEncoderDecoderModel, DonutProcessor, pipeline
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Medical OCR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_dir = os.path.dirname(os.path.abspath(__file__))
donut_model_path = os.path.join(current_dir, "model")

try:
    processor = DonutProcessor.from_pretrained(donut_model_path)
    donut_model = VisionEncoderDecoderModel.from_pretrained(donut_model_path)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    donut_model.to(device)
    donut_model.eval()
except Exception as e:
    print(f"Warning: Donut model could not be loaded. {e}")
    device = "cpu"

try:
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=0 if device == "cuda" else -1)
except Exception as e:
    print(f"Warning: Zero-Shot Classifier could not be loaded. {e}")
    classifier = None

candidate_labels = ["medical prescription", "not medical prescription"]
medical_keywords = [
    "prescribed", "take", "mg", "ml", "capsules", "dosage",
    "dr.", "doctor", "patient", "medications", "apply", "signature",
    "clinic", "pharmacy", "rx", "dose", "medicine", "drug",
    "comprimé", "gélule", "sachet", "sirop"
]

def extract_text_from_image(image):
    image = image.convert("RGB")
    encoding = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        generated_ids = donut_model.generate(
            encoding.pixel_values, 
            max_length=512, 
            num_beams=1,
            early_stopping=True,
            decoder_start_token_id=processor.tokenizer.convert_tokens_to_ids("<s_ocr>")
        )
    return processor.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

def classify_prescription_zero_shot(text):
    if not text or not classifier:
        return "No text found" if not text else "Classifier not loaded", 0.0

    result = classifier(text, candidate_labels)
    predicted_label = result["labels"][0]
    confidence = result["scores"][0]

    text_lower = text.lower()
    has_medical_keywords = any(keyword in text_lower for keyword in medical_keywords)

    if predicted_label == "not medical prescription" and has_medical_keywords:
        predicted_label = "medical prescription"
        confidence = max(confidence, 0.75)
    elif predicted_label == "medical prescription" and not has_medical_keywords:
        predicted_label = "not medical prescription"
        confidence = max(confidence, 0.75)

    return predicted_label, confidence

@app.post("/scan")
async def scan_prescription(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        extracted_text = extract_text_from_image(image)
        predicted_label, confidence = classify_prescription_zero_shot(extracted_text)
        
        return {
            "text": extracted_text,
            "label": predicted_label,
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
