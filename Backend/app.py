
from flask import Flask, jsonify, request, make_response, session, send_file
from flask_cors import CORS
import psycopg2
import os
import logging
from datetime import datetime
from flask_session import Session
from database import init_db
from routes.auth import auth_bp
from routes.medical_personnel import medical_personnel_bp
from routes.subjects import subjects_bp
from routes.message import message_bp
from routes.admins import admins_bp
from routes.calibration import calibration_bp
from routes.backendroutes import backend_bp

app = Flask(__name__)

# PostgreSQL Connection
DB_CONFIG = {
    "host": "10.8.0.12",
    "database": "metabase",
    "user": "metabase",
    "password": "rcts"
}

# Function to log requests and responses into PostgreSQL
def log_request(api_path, request_type, response_status, response_message):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO PMIS_logs (api_path, request_type, response_status, response_message) "
            "VALUES (%s, %s, %s, %s) RETURNING id, timestamp;",
            (api_path, request_type, response_status, response_message)
        )
        log_id, timestamp = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Logged Request: {log_id} | {api_path} | {request_type} | {response_status} | {response_message} | {timestamp}")
    except Exception as e:
        print(f"❌ Error logging request: {e}")

# List of allowed origins
allowed_origins = [
    "http://10.8.0.13:4001",
    "http://localhost:3000",
    "https://pl-app.iiit.ac.in"
]

CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# Configure Flask-Session
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = os.path.join(os.path.dirname(__file__), 'flask_session')
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'growth-tracking:'

# Initialize Flask-Session
Session(app)

# Ensure the session directory exists
if not os.path.exists(app.config['SESSION_FILE_DIR']):
    os.makedirs(app.config['SESSION_FILE_DIR'])

init_db()

# Middleware to log every request and response
@app.before_request
def before_request():
    pass  # Nothing needed here for logging, will do that after the response

@app.after_request
def after_request(response):
    log_request(request.path, request.method, response.status_code, response.get_data(as_text=True))
    return response

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(medical_personnel_bp)
app.register_blueprint(subjects_bp)
app.register_blueprint(message_bp)
app.register_blueprint(admins_bp)
app.register_blueprint(calibration_bp)
app.register_blueprint(backend_bp)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Hello, this is a message from the server!"}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Backend API is running',
        'version': '1.0',
        'timestamp': str(datetime.now())
    })

if __name__ == "__main__":
    print("🔄 Connecting to PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to PostgreSQL successfully!")
        conn.close()
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
    
    app.run(host='0.0.0.0', port=4200, debug=True)
