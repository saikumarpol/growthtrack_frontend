from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
import base64
import numpy as np
import cv2
from routes.functions_apis import checkerboard_detection, calibrate, resize_image
from database import db

calibration_bp = Blueprint('calibration', __name__)

@calibration_bp.route("/<id>/calibrate", methods=['POST'])
def calibrate_or_recalibrate(id):
    try:
        id_obj = ObjectId(id)
        m_id = db['Medical Personnel'].find_one({'_id': id_obj})

        if not m_id:
            return jsonify({'status': 'Warning', 'message': 'Medical Personnel not found'}), 404

        body = request.form
        calibration_height = body.get('height')
        checkerboard_size = body.get('checkerboard')
        width_checkerboard = body.get('width')
        image_file = request.files['image']
        image_data = base64.b64encode(image_file.read())

        # Decode the image data
        calib = base64.b64decode(image_data)
        nparr = np.frombuffer(calib, np.uint8)
        calib_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        cv2.imwrite('calibration.jpeg', calib_img, [cv2.IMWRITE_JPEG_QUALITY, 50])
        
        img = cv2.imread('calibration.jpeg')  # For focal length
        i_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        i_gray_shrunk = resize_image(i_gray, 3)[1]
        s_max = np.max(i_gray_shrunk)
        s_dev = np.std(i_gray_shrunk)
        i_b = cv2.threshold(i_gray_shrunk, s_max - s_dev, 255, cv2.THRESH_BINARY)[1]
        print("in ib ",i_b)
        # Check for checkerboard detection
        result = checkerboard_detection(i_b)
        print("res is",result)
        # Determine focal length based on checkerboard detection
        if result[0]:
            print("res is true",result)
            calibrated_focalLength = calibrate(image_data, calibration_height, checkerboard_size)
        else:
            print("res false is",result)
            calibrated_focalLength = 100
        
        # Check if calibration data exists
        c_data = db['Calibration_Mp'].find_one({'mp_id': id})
        calibration_data = {
            "calibration_height": calibration_height,
            "checkerboard_size": checkerboard_size,
            "width_checkerboard": width_checkerboard,
            "focal_length": calibrated_focalLength,
            "image": image_data
        }
        
        if c_data:
            # Update existing calibration data
            db['Calibration_Mp'].update_one(
                {'mp_id': id},
                {'$set': calibration_data}
            )
        else:
            # Insert new calibration data
            calibration_data["mp_id"] = id
            db['Calibration_Mp'].insert_one(calibration_data)

        db['Medical Personnel'].update_one(
            {'_id': ObjectId(id)},
            {'$set': {"calib_status": 1}}
        )
        print("done")
        return jsonify({
            'status': 'Success',
            'focalLength': calibrated_focalLength,
            'message': 'Checkerboard detected' if result else 'Checkerboard not found, default focal length used'
        })

    except Exception as e:
        return jsonify({'status': 'Warning', 'message': 'An error occurred: ' + str(e)}), 500
