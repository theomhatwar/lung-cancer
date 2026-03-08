import io
import numpy as np
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image

app = Flask(__name__)
CORS(app)

# Path to your SavedModel folder
MODEL_PATH = "model/efficientnet_savedmodel"
IMG_SIZE = 224
classes = ["N", "SCC", "ACA"]

# Load model using SavedModel format
print("Loading model...")
model = tf.saved_model.load(MODEL_PATH)
infer = model.signatures["serving_default"]
print("Model loaded successfully!")

# Class descriptions for better explanations
class_descriptions = {
    "N": "Normal lung tissue",
    "SCC": "Squamous Cell Carcinoma",
    "ACA": "Adenocarcinoma"
}

# Preprocess the uploaded image
def preprocess_image(file):
    img = Image.open(io.BytesIO(file)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img)
    # If you used cv2 in Colab, convert RGB → BGR
    img_array = img_array[:, :, ::-1]
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    img_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)
    return img_tensor

# Get AI explanation from Gemini
def get_gemini_explanation(diagnosis, confidence, class_name):
    try:
        # Your Google Gemini API Key - set this as environment variable
        gemini_api_key = "YOUR_GEMINI_API_KEY"  # Replace with actual key or use environment variable
        
        if not gemini_api_key or gemini_api_key == "YOUR_GEMINI_API_KEY":
            return get_fallback_explanation(diagnosis, confidence, class_name)
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_api_key}"
        
        full_diagnosis = class_descriptions.get(diagnosis, diagnosis)
        
        prompt = f"""
You are a medical AI assistant specializing in lung histopathology. Provide a comprehensive explanation for the following diagnosis:

DIAGNOSIS: {full_diagnosis} ({diagnosis})
CONFIDENCE LEVEL: {(confidence * 100):.1f}%

Please provide a structured JSON response with the following fields:

1. "features": Array of 3-5 key histological features that support this diagnosis
2. "reasoning": Detailed medical reasoning behind this classification (2-3 sentences)
3. "recommendations": Array of 3-4 clinical next steps or considerations
4. "clinical_correlations": Brief note on clinical implications (1-2 sentences)

Guidelines:
- Be medically accurate but accessible
- Focus on lung tissue histopathology
- Consider the confidence level in your explanation
- Provide actionable insights for clinicians
- Use clear, professional medical terminology

Return ONLY valid JSON format, no additional text.
"""
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        text_response = result['candidates'][0]['content']['parts'][0]['text']
        
        # Clean the response and parse JSON
        cleaned_text = text_response.replace('```json', '').replace('```', '').strip()
        explanation = json.loads(cleaned_text)
        
        return explanation
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return get_fallback_explanation(diagnosis, confidence, class_name)

# Fallback explanation if Gemini is unavailable
def get_fallback_explanation(diagnosis, confidence, class_name):
    full_diagnosis = class_descriptions.get(diagnosis, diagnosis)
    
    base_features = {
        "N": [
            "Regular alveolar structure preservation",
            "Normal bronchial epithelium without atypia",
            "Appropriate tissue architecture maintenance"
        ],
        "SCC": [
            "Keratin pearl formation observed",
            "Intercellular bridge presence",
            "Cytoplasmic keratinization patterns"
        ],
        "ACA": [
            "Glandular differentiation patterns",
            "Mucin production evidence",
            "Acinar or papillary growth structures"
        ]
    }
    
    base_reasoning = {
        "N": f"The tissue appears normal with preserved architecture and no significant cytological atypia. The model is {(confidence * 100):.1f}% confident in this assessment based on standard histological features.",
        "SCC": f"Features consistent with squamous differentiation including keratinization and intercellular bridges. The classification confidence is {(confidence * 100):.1f}% based on characteristic morphological patterns.",
        "ACA": f"Glandular formation and mucin production support adenocarcinoma classification. The model achieved {(confidence * 100):.1f}% confidence in identifying these diagnostic features."
    }
    
    base_recommendations = [
        "Consult with a certified pathologist for confirmation",
        "Correlate findings with clinical presentation and imaging",
        "Consider additional staining if diagnostic uncertainty exists",
        "Follow established clinical guidelines for this diagnosis"
    ]
    
    return {
        "features": base_features.get(diagnosis, ["Histological pattern analysis", "Cellular morphology assessment", "Tissue architecture evaluation"]),
        "reasoning": base_reasoning.get(diagnosis, f"The AI model identified features consistent with {full_diagnosis} with {(confidence * 100):.1f}% confidence based on learned histological patterns."),
        "recommendations": base_recommendations,
        "clinical_correlations": "This AI analysis should be used as an assistive tool alongside professional pathological evaluation."
    }

# Prediction endpoint
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        img_tensor = preprocess_image(file.read())

        # Predict using SavedModel signature
        pred_dict = infer(img_tensor)
        pred_values = list(pred_dict.values())[0].numpy()  # shape: (1, 3)

        # Apply softmax if needed
        prob_array = tf.nn.softmax(pred_values, axis=1).numpy()[0]

        class_index = int(np.argmax(prob_array))
        diagnosis = classes[class_index]
        confidence = float(prob_array[class_index])
        
        class_name = class_descriptions.get(diagnosis, diagnosis)

        return jsonify({
            "type": diagnosis,
            "type_description": class_name,
            "confidence": confidence,
            "all_predictions": {
                "Normal": float(prob_array[0]),
                "Squamous_Cell_Carcinoma": float(prob_array[1]),
                "Adenocarcinoma": float(prob_array[2])
            }
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# New endpoint for AI explanations
@app.route("/explain", methods=["POST"])
def explain_diagnosis():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        diagnosis = data.get("diagnosis")
        confidence = data.get("confidence")
        
        if not diagnosis or confidence is None:
            return jsonify({"error": "Missing diagnosis or confidence"}), 400
        
        # Get the full class name for better explanations
        class_name = class_descriptions.get(diagnosis, diagnosis)
        
        # Get explanation from Gemini
        explanation = get_gemini_explanation(diagnosis, confidence, class_name)
        
        return jsonify({
            "explanation": explanation,
            "diagnosis": diagnosis,
            "diagnosis_full": class_name,
            "confidence": confidence
        })
        
    except Exception as e:
        print("Explanation error:", e)
        return jsonify({"error": f"Failed to generate explanation: {str(e)}"}), 500

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "endpoints": ["/predict", "/explain", "/health"]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)