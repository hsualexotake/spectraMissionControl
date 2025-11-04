import os
import io
import csv
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from agents.parse_agent import parse_log_text
from docking_logic import process_docking_request
from docking_rules import DOCKING_PORTS
import PyPDF2

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

def extract_text_from_file(file, filename: str) -> str:
    """
    Extract text from uploaded file based on file type.

    Args:
        file: FileStorage object from Flask request
        filename: Original filename with extension

    Returns:
        Extracted text content as string

    Raises:
        UnicodeDecodeError: If text file has encoding issues
        PyPDF2 exceptions: If PDF is corrupted/encrypted
    """
    file_ext = filename.lower()

    if file_ext.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(file)
        text_parts = []
        for page in pdf_reader.pages:
            text_parts.append(page.extract_text())
        return '\n'.join(text_parts).strip()

    elif file_ext.endswith('.txt'):
        return file.read().decode('utf-8')

    elif file_ext.endswith('.csv'):
        # Read CSV and convert to readable text for LLM
        file.seek(0)
        text_wrapper = io.TextIOWrapper(file, encoding='utf-8')
        csv_reader = csv.DictReader(text_wrapper)

        # Convert CSV rows to human-readable text
        lines = []
        for row in csv_reader:
            # Format each row as "field: value, field: value"
            row_text = ', '.join(f"{key}: {value}" for key, value in row.items())
            lines.append(row_text)

        return '\n'.join(lines)

    else:
        raise ValueError(f"Unsupported file type: {file_ext}")

def serialize_schedule():
    """
    Convert DOCKING_PORTS schedule to JSON-serializable format.

    Returns:
        Dictionary with ports and their missions (datetime converted to ISO strings)
    """
    serialized = {}
    for port, missions in DOCKING_PORTS.items():
        serialized[port] = [
            {
                'mission_id': m['mission_id'],
                'start_time': m['start_time'].isoformat() + 'Z',
                'end_time': m['end_time'].isoformat() + 'Z',
                'team': m['team']
            }
            for m in missions
        ]
    return serialized

@app.route('/api/process-mission', methods=['POST'])
def process_mission_endpoint():
    """
    Parse mission log file and automatically process docking request.
    One-click processing: upload file -> parse -> dock -> return result.

    Accepts .txt, .pdf, and .csv files and uses AI to normalize the data,
    then immediately processes the docking request.

    Returns:
        JSON with parsed mission data and docking result
    """
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    # Validate file
    if file.filename == '' or not file.filename.lower().endswith(('.txt', '.pdf', '.csv')):
        return jsonify({'error': 'Invalid file type. Supported: .txt, .pdf, .csv'}), 400

    try:
        # Step 1: Extract text from file
        file.seek(0)
        log_content = extract_text_from_file(file, file.filename)

        if not log_content.strip():
            return jsonify({'error': 'File is empty'}), 400

        # Step 2: Parse the log using AI agent
        parsed_data = parse_log_text(log_content)

        # Step 3: Automatically process docking request
        docking_result = process_docking_request(parsed_data)

        # Step 4: Return combined result
        return jsonify({
            'filename': file.filename,
            'parsed_data': parsed_data,
            'docking_result': docking_result
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to process mission: {str(e)}'}), 500

@app.route('/api/docking-status', methods=['GET'])
def get_docking_status():
    """
    Get current docking schedule for all ports.

    Returns:
        JSON with all ports and their scheduled missions
    """
    return jsonify({
        'ports': serialize_schedule()
    }), 200

@app.route('/api/clear-schedule', methods=['POST'])
def clear_schedule():
    """
    Clear all missions from the docking schedule.

    Returns:
        JSON with success message
    """
    try:
        # Clear all ports by resetting them to empty lists
        for port in DOCKING_PORTS:
            DOCKING_PORTS[port] = []

        return jsonify({
            'message': 'Schedule cleared successfully',
            'ports': serialize_schedule()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to clear schedule: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(debug=True, port=port)
