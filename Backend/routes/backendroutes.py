import os
import logging
import numpy as np
import cv2
from flask import Blueprint, request, jsonify, session, send_file
from ultralytics import YOLO
import datetime
import pymongo
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MongoDB connection with error handling
try:
    mongo_client = pymongo.MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test the connection
    mongo_client.admin.command('ping')
    db = mongo_client.get_database('PMIS_001-v3')
    logger.info("MongoDB connection established successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    db = None

# Create blueprint
backend_bp = Blueprint('backend', __name__)

# Create a directory to store output images
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load YOLO model
try:
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yolo11n-seg.pt")
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
            if result.boxes is not None:
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
            if result.boxes is not None:
                for box in result.boxes:
                    xywh = box.xywh.flatten()
                    if len(xywh) == 4:
                        height_in_pixels = xywh[3].item()
                        height_in_cm = (height_in_pixels / ppm)
                        logger.info(f"Height in pixels: {height_in_pixels}, PPM: {ppm}, Height in cm: {height_in_cm}")
                        return round(height_in_cm, 2)

        return 0

# Initialize services
height_service = HeightCalibrationService()
height_estimation_service = HeightEstimationService()
image_processor = ImageProcessor()

@backend_bp.route('/', methods=['GET'])
def default_home():
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

@backend_bp.route('/api/get-backend-url', methods=['GET'])
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

@backend_bp.route('/api/height-calibration', methods=['POST'])
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
            except (ValueError, TypeError) as e:
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
                yaw = float(yaw) if yaw else 0.0
                roll = float(roll)
            except (ValueError, TypeError) as e:
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
        
        # Store calibration data in MongoDB
        if db is not None:
            try:
                # Get user ID from request if available
                user_id = request.form.get('userId')
                
                # Create document to insert
                calibration_doc = {
                    "timestamp": datetime.datetime.utcnow(),
                    "ppm": session['ppm'],
                    "calibration_height": calibration_height
                }
                
                # Add optional fields if provided
                if user_id:
                    calibration_doc["userId"] = user_id
                if dz:
                    try:
                        calibration_doc["distance"] = float(dz)
                    except (ValueError, TypeError):
                        pass
                    
                # Insert into calibration_data collection
                db.calibration_data.insert_one(calibration_doc)
                logger.info(f"Calibration data stored in MongoDB for user: {user_id}")
            except Exception as e:
                logger.error(f"Error storing calibration data in MongoDB: {str(e)}")
                # Don't fail the request if MongoDB operation fails
        else:
            logger.warning("MongoDB not available, skipping data storage")

        logger.info("Height calibration response sent successfully.")

        return jsonify({
            'ppm': session['ppm'],
            'calibration_height': calibration_height
        })

    except Exception as e:
        logger.error(f"Error during calibration: {str(e)}")
        return jsonify({'error': 'Calibration failed. Check the input image or model configuration.'}), 500

@backend_bp.route('/api/height-estimation', methods=['POST'])
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

        # Get subject information if provided
        subject_id = request.form.get('subjectId')
        subject_name = request.form.get('subjectName')
        subject_age = request.form.get('subjectAge')
        subject_gender = request.form.get('subjectGender')
        
        logger.info(f"Subject information received: ID={subject_id}, Name={subject_name}, Age={subject_age}, Gender={subject_gender}")

        # Validate PPM
        if not ppm:
            logger.error("PPM value is missing. Using default value of 10.0")
            ppm = 10.0  # Default value if no PPM is provided
            # Store this default value in session for future requests
            session['ppm'] = ppm
            logger.info(f"Using default PPM value: {ppm}")

        try:
            ppm = float(ppm)
        except (ValueError, TypeError):
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
                yaw = float(yaw) if yaw else 0.0
                roll = float(roll)
            except (ValueError, TypeError) as e:
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
        
        # Store height estimation result in MongoDB
        if db is not None:
            try:
                # Create document to insert
                estimation_doc = {
                    "timestamp": datetime.datetime.utcnow(),
                    "estimated_height": height_cm,
                    "ppm": ppm
                }
                
                # Add subject information if provided
                if subject_id:
                    estimation_doc["subjectId"] = subject_id
                if subject_name:
                    estimation_doc["subjectName"] = subject_name
                if subject_age:
                    try:
                        estimation_doc["subjectAge"] = int(subject_age)
                    except (ValueError, TypeError):
                        estimation_doc["subjectAge"] = subject_age
                if subject_gender:
                    estimation_doc["subjectGender"] = subject_gender
                    
                # Insert into estimation_data collection
                db.estimation_data.insert_one(estimation_doc)
                logger.info(f"Height estimation data stored in MongoDB for subject: {subject_name or subject_id}")
            except Exception as e:
                logger.error(f"Error storing height estimation data in MongoDB: {str(e)}")
                # Don't fail the request if MongoDB operation fails
        else:
            logger.warning("MongoDB not available, skipping data storage")
        
        response_data = {'height_cm': height_cm}
        
        # Add subject information to response if available
        if subject_id:
            response_data['subjectId'] = subject_id
        if subject_name:
            response_data['subjectName'] = subject_name
            
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error during height estimation: {str(e)}")
        return jsonify({'error': 'Height estimation failed. Check the input image or model configuration.'}), 500

@backend_bp.route('/api/reset-calibration', methods=['POST'])
def reset_calibration():
    session.clear()
    return jsonify({'message': 'Calibration data cleared'})