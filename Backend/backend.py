import os
import logging
import numpy as np
import cv2
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from flask_session import Session
from ultralytics import YOLO
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Update CORS configuration
CORS(
    app,
    resources={r"/*": {"origins": ["*"]}},
    supports_credentials=True
)

app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key')

# Configure Flask-Session
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

# Create a directory to store output images
OUTPUT_DIR = "output_images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load YOLO model
try:
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "yolo11n-seg.pt")
    model = YOLO(MODEL_PATH)
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {str(e)}")
    raise

def convert_image_to_array(image_bytes: bytes) -> np.ndarray:
    """
    Convert image bytes to numpy array.
    
    Args:
        image_bytes (bytes): The image data in bytes format
        
    Returns:
        np.ndarray: The image as a numpy array
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image")
        return img
    except Exception as e:
        logger.error(f"Error converting image to array: {str(e)}")
        raise

class ImageProcessor:
    def rotate_image(self, input_img: np.ndarray, pitch: float = 0, yaw: float = 0, roll: float = 0, dx: float = 0, dy: float = 0, dz: float = 1000, f: float = 1000) -> np.ndarray:
        """
        Rotate and transform the input image based on provided parameters.
        
        Args:
            input_img: Input image as numpy array
            pitch: Rotation around X-axis in degrees
            yaw: Rotation around Z-axis in degrees
            roll: Rotation around Y-axis in degrees
            dx: Translation along X-axis
            dy: Translation along Y-axis
            dz: Translation along Z-axis
            f: Focal length for perspective transform
            
        Returns:
            Transformed image as numpy array
        """
        pitch = np.radians(pitch)
        yaw = np.radians(yaw)
        roll = np.radians(roll)

        h, w = input_img.shape[:2]

        A1 = np.array([
            [1, 0, -w / 2],
            [0, 1, -h / 2],
            [0, 0, 0],
            [0, 0, 1]
        ], dtype=np.float32)

        RX = np.array([
            [1, 0, 0, 0],
            [0, np.cos(pitch), -np.sin(pitch), 0],
            [0, np.sin(pitch), np.cos(pitch), 0],
            [0, 0, 0, 1]
        ], dtype=np.float32)

        RY = np.array([
            [np.cos(roll), 0, np.sin(roll), 0],
            [0, 1, 0, 0],
            [-np.sin(roll), 0, np.cos(roll), 0],
            [0, 0, 0, 1]
        ], dtype=np.float32)

        RZ = np.array([
            [np.cos(yaw), -np.sin(yaw), 0, 0],
            [np.sin(yaw), np.cos(yaw), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ], dtype=np.float32)

        R = RZ @ RX @ RY

        T = np.array([
            [1, 0, 0, dx],
            [0, 1, 0, dy],
            [0, 0, 1, dz],
            [0, 0, 0, 1]
        ], dtype=np.float32)

        A2 = np.array([
            [f, 0, w / 2, 0],
            [0, f, h / 2, 0],
            [0, 0, 1, 0]
        ], dtype=np.float32)

        trans = A2 @ (T @ (R @ A1))
        output_img = cv2.warpPerspective(input_img, trans, (w, h), flags=cv2.INTER_LANCZOS4)
        return output_img

class HeightCalibrationService:
    def height_calibration(self, image_array: np.ndarray, calib_height: float) -> dict:
        """
        Perform height calibration using YOLO predictions.
        """
        try:
            results = model.predict(source=image_array)
        except Exception as e:
            logger.error(f"Error during YOLO prediction: {str(e)}")
            return {"error": "YOLO prediction failed. Check the input image or model configuration."}

        ppm_value: float = 0.0

        for result in results:
            for box in result.boxes:
                xywh = box.xywh.flatten()
                if len(xywh) == 4:
                    height = xywh[3].item()
                    ppm_value = round(height / calib_height, 2)
                    logger.info(f"Detected Height: {height} px, Calibration Height: {calib_height} cm, Calculated PPM: {ppm_value} px/m")
                    break

        if ppm_value == 0.0:
            return {"error": "No valid bounding boxes found."}

        return {"calculated_ppm": ppm_value}

class HeightEstimationService:
    def height_estimation(self, image_array: np.ndarray, ppm: float) -> float:
        """
        Estimate object heights from an image using YOLO predictions.
        """
        try:
            results = model.predict(source=image_array)
        except Exception as e:
            logger.error(f"Error during YOLO prediction: {str(e)}")
            raise e

        for result in results:
            for box in result.boxes:
                xywh = box.xywh.flatten()
                if len(xywh) == 4:
                    height_in_pixels = xywh[3].item()
                    height_in_cm = (height_in_pixels / ppm)
                    logger.info(f"Height in pixels: {height_in_pixels}, PPM: {ppm}, Height in cm: {height_in_cm}")
                    return round(height_in_cm, 2)

        return 0

height_service = HeightCalibrationService()
height_estimation_service = HeightEstimationService()
image_processor = ImageProcessor()

@app.route('/', methods=['GET'])
def default_home():
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

@app.route('/api/get-backend-url', methods=['GET'])
def get_backend_url():
    calibration_url = "http://localhost:5000/api/height-calibration"
    estimation_url = "http://localhost:5000/api/height-estimation"
    correction_url = "http://localhost:5000/api/image-correction"

    url_type = request.args.get('type', 'default')

    if url_type == 'calibration':
        return jsonify({"backendUrl": calibration_url})
    elif url_type == 'estimation':
        return jsonify({"backendUrl": estimation_url})
    elif url_type == 'correction':
        return jsonify({"backendUrl": correction_url})
    else:
        return jsonify({"backendUrl": request.host_url})

@app.route('/api/height-calibration', methods=['POST'])
def height_calibration():
    logger.info("Height calibration request received.")
    logger.info(f"Request headers: {request.headers}")
    logger.info(f"Request form data: {request.form}")
    logger.info(f"Request files: {request.files}")

    try:
        # Check if image is provided
        if 'image' not in request.files:
            logger.error("No image file provided in the request.")
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        calibration_height = request.form.get('calibration_height')
        dx = request.form.get('dx')
        dy = request.form.get('dy')
        dz = request.form.get('dz')
        focal_length = request.form.get('focal_length')
        pitch = request.form.get('pitch')
        yaw = request.form.get('yaw', 0)
        roll = request.form.get('roll')

        # Check if any optional parameter is None
        if any(param is None for param in [dx, dy, dz, focal_length, pitch, yaw, roll]):
            logger.info("Incomplete data received. Using default values for missing parameters.")
            # Convert calibration height to float
            try:
                calibration_height = float(calibration_height)
            except ValueError as e:
                logger.error(f"Invalid calibration height: {str(e)}")
                return jsonify({'error': 'Invalid calibration_height value. Ensure it is a valid float.'}), 400

            # Convert image to numpy array
            image_array = convert_image_to_array(image_file.read())

            # Call height calibration service directly
            result = height_service.height_calibration(image_array, calibration_height)
        else:
            logger.info("All required parameters received. Performing image correction.")
            # Convert all inputs to float
            try:
                calibration_height = float(calibration_height)
                dx = float(dx)
                dy = float(dy)
                dz = float(dz)
                focal_length = float(focal_length)
                pitch = float(pitch)
                yaw = float(yaw)
                roll = float(roll)
            except ValueError as e:
                logger.error(f"Invalid input values: {str(e)}")
                return jsonify({'error': 'Invalid input values. Ensure all numeric fields are valid floats.'}), 400

            # Convert image to numpy array
            image_array = convert_image_to_array(image_file.read())

            # Call ImageProcessor to correct the image
            corrected_image = image_processor.rotate_image(
                input_img=image_array,
                pitch=pitch,
                yaw=yaw,
                roll=roll,
                dx=dx,
                dy=dy,
                dz=dz,
                f=focal_length
            )
            # Call height calibration service with corrected image
            result = height_service.height_calibration(corrected_image, calibration_height)

        if "error" in result:
            logger.error(f"Height calibration error: {result['error']}")
            return jsonify(result), 400

        # Store PPM in session
        session['ppm'] = float(result['calculated_ppm'])
        logger.info(f"PPM value stored in session: {session['ppm']}")
        logger.info("Height calibration response sent successfully.")

        return jsonify({
            'ppm': session['ppm'],
            'calibration_height': calibration_height
        })

    except Exception as e:
        logger.error(f"Error during calibration: {str(e)}")
        return jsonify({'error': 'Calibration failed. Check the input image or model configuration.'}), 500

@app.route('/api/height-estimation', methods=['POST'])
def height_estimation():
    logger.info("Height estimation request received.")
    logger.info(f"Request headers: {request.headers}")
    logger.info(f"Request form data: {request.form}")
    logger.info(f"Request files: {request.files}")

    try:
        # Check if image is provided
        if 'image' not in request.files:
            logger.error("No image file provided in the request.")
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        ppm = request.form.get('ppm') or session.get('ppm')
        dx = session.get('dx')
        dy = session.get('dy')
        dz = session.get('dz')
        focal_length = session.get('focalLength')
        pitch = session.get('pitch')
        yaw = session.get('yaw')
        roll = session.get('roll')

        # Validate PPM
        if not ppm:
            logger.error("PPM value is missing.")
            return jsonify({'error': 'PPM value is required'}), 400

        try:
            ppm = float(ppm)
        except ValueError:
            logger.error("Invalid PPM value provided.")
            return jsonify({'error': 'Invalid PPM value. Ensure it is a valid float.'}), 400

        # Check if optional parameters exist
        if any(param is None for param in [dx, dy, dz, focal_length, pitch, yaw, roll]):
            logger.info("Incomplete data received. Using default values for missing parameters.")
            # Convert image to numpy array
            image_array = convert_image_to_array(image_file.read())

            # Call height estimation service directly
            height_cm = height_estimation_service.height_estimation(image_array, ppm)
        else:
            logger.info("All required parameters received. Performing image correction.")
            # Convert all inputs to float
            try:
                dx = float(dx)
                dy = float(dy)
                dz = float(dz)
                focal_length = float(focal_length)
                pitch = float(pitch)
                yaw = float(yaw)
                roll = float(roll)
            except ValueError as e:
                logger.error(f"Invalid input values: {str(e)}")
                return jsonify({'error': 'Invalid input values. Ensure all numeric fields are valid floats.'}), 400

            # Convert image to numpy array
            image_array = convert_image_to_array(image_file.read())

            # Call ImageProcessor to correct the image
            corrected_image = image_processor.rotate_image(
                input_img=image_array,
                pitch=pitch,
                yaw=yaw,
                roll=roll,
                dx=dx,
                dy=dy,
                dz=dz,
                f=focal_length
            )
            # Call height estimation service with corrected image
            height_cm = height_estimation_service.height_estimation(corrected_image, ppm)

        if height_cm == 0:
            logger.error("Height estimation failed. No valid bounding boxes found.")
            return jsonify({'error': 'Height estimation failed. No valid bounding boxes found.'}), 400

        logger.info(f"Height estimation successful. Estimated height: {height_cm} cm")
        return jsonify({'height_cm': height_cm})

    except Exception as e:
        logger.error(f"Error during height estimation: {str(e)}")
        return jsonify({'error': 'Height estimation failed. Check the input image or model configuration.'}), 500

@app.route('/api/reset-calibration', methods=['POST'])
def reset_calibration():
    session.clear()
    return jsonify({'message': 'Calibration data cleared'})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Backend API is running',
        'version': '1.0',
        'timestamp': str(datetime.datetime.now())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)






