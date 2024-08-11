import os
import re
import logging
import traceback
from flask import Flask, request, render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import vertexai.preview.generative_models as generative_models
import json
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get the directory of the current script
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, template_folder=os.path.join(basedir, 'templates'), static_folder=os.path.join(basedir, 'static'))

# Configure upload folder
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
RESPONSE_FOLDER = os.path.join(basedir, 'responses')
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESPONSE_FOLDER'] = RESPONSE_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Ensure upload and response folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESPONSE_FOLDER, exist_ok=True)

# Vertex AI setup
vertexai.init(project="genaifordata", location="us-central1")

# Load system prompt from file
system_prompt_path = os.path.join(basedir, 'templates', 'systemprompt.txt')
with open(system_prompt_path, 'r') as file:
    SYSTEM_PROMPT = file.read()

generation_config = {
    "max_output_tokens": 8192,
    "temperature": 1,
    "top_p": 0.95,
}

safety_settings = {
    generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        try:
            logger.info("Received POST request")
            if 'file' not in request.files:
                logger.error("No file part in the request")
                return jsonify({'error': 'No file part in the request'}), 400
            file = request.files['file']
            name = request.form.get('name')
            origin = request.form.get('origin')
            submission_details = request.form.get('submission_details')

            logger.info(f"Received file: {file.filename}, name: {name}, origin: {origin}, submission: {submission_details}")

            # Input validation
            if not all([name, origin, submission_details]):
                logger.error("Missing required fields")
                return jsonify({'error': 'All fields are required'}), 400
            if len(name) > 100 or len(origin) > 100 or len(submission_details) > 500:
                logger.error("Input fields exceed maximum length")
                return jsonify({'error': 'Input fields exceed maximum allowed length'}), 400

            if file.filename == '':
                logger.error("No selected file")
                return jsonify({'error': 'No selected file'}), 400
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                logger.info(f"File saved to {filepath}")
                
                try:
                    result = process_video(filepath, name, origin, submission_details)
                    logger.info("Video processed successfully")
                    return jsonify(result)
                except Exception as e:
                    logger.exception(f"Error processing video: {e}")
                    return jsonify({'error': str(e)}), 500
                finally:
                    try:
                        if os.path.exists(filepath):
                            os.remove(filepath)
                            logger.info(f"Temporary file {filepath} removed")
                    except Exception as e:
                        logger.error(f"Error removing file: {e}")
            else:
                logger.error(f"File type not allowed: {file.filename}")
                return jsonify({'error': 'File type not allowed'}), 400
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    return render_template('upload.html')

def process_video(video_path, name, origin, submission_details):
    logger.info(f"Processing video for {name} from {origin}")
    try:
        with open(video_path, 'rb') as video_file:
            video_content = video_file.read()
        
        video_part = Part.from_data(
            mime_type="video/mp4",
            data=video_content
        )
        
        text_part = f"""Evaluate this submission from {name}, an artist from {origin}, performing the following: {submission_details}"""

        model = GenerativeModel(
            "gemini-1.5-pro-001",
            generation_config={
                "max_output_tokens": 8192,
                "temperature": 0.3,
                "top_p": 0.95,
            },
            safety_settings={
                generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        )
        
        chat = model.start_chat()
        chat.send_message(SYSTEM_PROMPT)
        
        logger.info("Sending request to AI model")
        response = chat.send_message([video_part, text_part])

        # Log the raw response
        logger.debug(f"Raw AI response: {response.text}")

        # Save the raw response to a file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        raw_response_filename = f"raw_response_{timestamp}.txt"
        raw_response_filepath = os.path.join(app.config['RESPONSE_FOLDER'], raw_response_filename)
        with open(raw_response_filepath, 'w') as f:
            f.write(response.text)
        logger.info(f"Raw response saved to {raw_response_filepath}")

        # Remove any leading/trailing whitespace
        cleaned_response = response.text.strip()

        try:
            result = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Cleaned response: {cleaned_response}")
            
            # Fallback: Create a simple JSON structure with the raw text
            result = {
                "script": [
                    {
                        "speaker": "AI",
                        "text": response.text,
                        "time": "0:00"
                    }
                ]
            }
            logger.info("Created fallback JSON structure")

        # Validate the response structure
        if not isinstance(result, dict) or 'script' not in result or not isinstance(result['script'], list):
            logger.error("Invalid AI response format: 'script' is missing or not a list")
            raise ValueError("Invalid AI response format: 'script' is missing or not a list")
        
        for entry in result['script']:
            if not all(key in entry for key in ['speaker', 'text', 'time']):
                logger.error("Invalid AI response format: script entry is missing required fields")
                raise ValueError("Invalid AI response format: script entry is missing required fields")
        
        logger.debug(f"Processed AI response: {result}")
        
        # Save the processed response to a file
        processed_response_filename = f"processed_response_{timestamp}.json"
        processed_response_filepath = os.path.join(app.config['RESPONSE_FOLDER'], processed_response_filename)
        with open(processed_response_filepath, 'w') as f:
            json.dump(result, f, indent=2)
        logger.info(f"Processed response saved to {processed_response_filepath}")
        
        return result
    except Exception as e:
        logger.exception(f"Error in process_video: {e}")
        raise

if __name__ == '__main__':
    app.run(debug=True)