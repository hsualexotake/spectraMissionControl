import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from agents.demo_agent import summarize_text

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

@app.route('/api/agent', methods=['POST'])
def agent_endpoint():
    """
    Demo agent endpoint that summarizes text.
    Uses LangChain with ChatOpenAI for summarization.
    """
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        # Call the demo summarization agent
        summary = summarize_text(message)
        response = {
            'message': summary,
            'note': 'Demo agent - Summarized by ChatGPT'
        }
        return jsonify(response), 200

    except Exception as e:
        # Handle errors (missing API key, network issues, etc.)
        error_message = str(e)
        return jsonify({
            'error': 'Agent failed',
            'details': error_message
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(debug=True, port=port)
