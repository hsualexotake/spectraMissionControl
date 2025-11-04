import os
import io
import csv
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from agents.parse_agent import parse_log_text
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

@app.route('/api/parse-logs', methods=['POST'])
def parse_logs_endpoint():
    """
    Parse log files and extract structured mission data.
    Accepts .txt, .pdf, and .csv files and uses AI to normalize the data.

    Returns:
        JSON with parsed mission data or error message
    """
    # Check if files were uploaded
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')
    results = []

    for file in files:
        # Skip invalid files
        if file.filename == '' or not file.filename.lower().endswith(('.txt', '.pdf', '.csv')):
            continue

        try:
            # Extract text based on file type
            file.seek(0)
            log_content = extract_text_from_file(file, file.filename)

            if not log_content.strip():
                continue

            # Parse the log using AI agent
            parsed_data = parse_log_text(log_content)

            results.append({
                'filename': file.filename,
                'data': parsed_data
            })

        except Exception:
            # Skip files that fail to parse
            continue

    return jsonify({'results': results}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(debug=True, port=port)
