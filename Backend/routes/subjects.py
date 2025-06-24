

from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db
from routes.functions_apis import charRecogAndDistDetect
import face_recognition
import numpy as np
import base64
import io
from PIL import Image
import requests
import os

subjects_bp = Blueprint('subjects', __name__)

# Function to insert a new subject
def insert_subject(data):
    return db['Subject'].insert_one(data)

# Function to update subject information
def update_subject(phone, data):
    return db['Subject'].update_one({'parent_phone_no': phone}, {'$set': data})

# Function to find a subject by parent phone number
def find_subject_by_phone(phone):
    return db['Subject'].find_one({'parent_phone_no': phone})

@subjects_bp.route("/updateSubjectHeight", methods=['POST'])
def update_subject_height():
    try:
        # Get data from request
        data = request.json
        print(f"Received height update request data: {data}")
        subject_id = data.get('subjectId')
        height = data.get('height')
        userId = data.get('userId', 'Unknown')
        method = data.get('method', 'Manual Entry')
        
        print(f"Processing height update for subjectId: {subject_id}, height: {height}")
        
        # Validate inputs
        if not subject_id or not height:
            print("Missing required fields: subject_id or height")
            return jsonify({'status': 'Error', 'message': 'Subject ID and height are required'}), 400
            
        if not ObjectId.is_valid(subject_id):
            print(f"Invalid subject ID format: {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Invalid subject ID format'}), 400
            
        try:
            height_value = float(height)
            print(f"Converted height to float: {height_value}")
        except ValueError:
            print(f"Invalid height value (not a number): {height}")
            return jsonify({'status': 'Error', 'message': 'Height must be a valid number'}), 400
        
        # Try to find the subject first
        subject = db['Subject'].find_one({'_id': ObjectId(subject_id)})
        if not subject:
            print(f"Subject not found with ID: {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404
            
        print(f"Found subject: {subject.get('name')} (ID: {subject_id})")
        
        # Create height measurement record
        height_record = {
            "value": str(height_value),
            "timestamp": datetime.now().isoformat(),
            "measured_by": userId,
            "method": method
        }
        
        # Prepare update operation
        update_operations = {}
        
        # If height array already exists, push to it, otherwise create it
        if 'height' in subject and isinstance(subject['height'], list):
            update_operations['$push'] = {'height': height_record}
        else:
            update_operations['$set'] = {'height': [height_record]}
        
        # Set calculated_height for easy access to the most recent value
        update_operations['$set'] = update_operations.get('$set', {})
        update_operations['$set']['calculated_height'] = str(height_value)
        update_operations['$set']['last_height_update'] = datetime.now().isoformat()
        
        # Calculate BMI and malnutrition status if weight is available
        if subject.get('weight') and isinstance(subject['weight'], list) and len(subject['weight']) > 0:
            try:
                latest_weight = subject['weight'][0] if subject['weight'][0].get('value') else subject['weight'][-1]
                weight_value = float(latest_weight.get('value', 0))
                
                if weight_value > 0:
                    height_m = height_value / 100  # Convert height from cm to meters
                    bmi = round(weight_value / (height_m * height_m), 2)
                    
                    # Create BMI record
                    bmi_record = {
                        "value": str(bmi),
                        "height": str(height_value),
                        "weight": str(weight_value),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # If bmi array already exists, push to it, otherwise create it
                    if 'bmi' in subject and isinstance(subject['bmi'], list):
                        if '$push' in update_operations:
                            update_operations['$push']['bmi'] = bmi_record
                        else:
                            update_operations['$push'] = {'bmi': bmi_record}
                    else:
                        update_operations['$set']['bmi'] = [bmi_record]
                    
                    # Calculate malnutrition status based on BMI (example logic)
                    malnutrition_status = calculate_malnutrition_status(bmi, subject.get('age'), subject.get('gender'))
                    malnutrition_record = {
                        "value": malnutrition_status,
                        "timestamp": datetime.now().isoformat(),
                        "measured_by": userId,
                        "method": "Calculated"
                    }
                    
                    # If malnutrition_status array already exists, push to it, otherwise create it
                    if 'malnutrition_status' in subject and isinstance(subject['malnutrition_status'], list):
                        if '$push' in update_operations:
                            update_operations['$push']['malnutrition_status'] = malnutrition_record
                        else:
                            update_operations['$push'] = {'malnutrition_status': malnutrition_record}
                    else:
                        update_operations['$set']['malnutrition_status'] = [malnutrition_record]
            except Exception as bmi_error:
                print(f"Error calculating BMI or malnutrition status: {bmi_error}")
                # Continue with height update even if BMI/malnutrition calculation fails
        
        # Update the subject with the new height and related data
        update_result = db['Subject'].update_one(
            {'_id': ObjectId(subject_id)},
            update_operations
        )
        
        print(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
        
        if update_result.modified_count > 0:
            print(f"Successfully updated height for subject {subject_id}")
            # Verify the update by retrieving the subject again
            updated_subject = db['Subject'].find_one({'_id': ObjectId(subject_id)})
            print(f"Updated subject data: height={updated_subject.get('calculated_height')}")
            return jsonify({
                'status': 'Success', 
                'message': 'Subject height updated successfully',
                'subject': {
                    'id': str(subject_id),
                    'name': subject.get('name'),
                    'height': str(height_value)
                }
            })
        elif update_result.matched_count > 0:
            print(f"Subject found but no changes made to height for subject {subject_id}")
            return jsonify({'status': 'Success', 'message': 'No changes made to subject height'})
        else:
            print(f"Failed to update subject: no matching document found for ID {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404
            
    except Exception as e:
        print(f"Error updating subject height: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'Error', 'message': str(e)}), 500

@subjects_bp.route("/updateSubjectWeight", methods=['POST'])
def update_subject_weight():
    try:
        # Get data from request
        data = request.json
        print(f"Received weight update request data: {data}")
        subject_id = data.get('subjectId')
        weight = data.get('weight')
        userId = data.get('userId', 'Unknown')
        method = data.get('method', 'Manual Entry')
        
        print(f"Processing weight update for subjectId: {subject_id}, weight: {weight}")
        
        # Validate inputs
        if not subject_id or not weight:
            print("Missing required fields: subject_id or weight")
            return jsonify({'status': 'Error', 'message': 'Subject ID and weight are required'}), 400
            
        if not ObjectId.is_valid(subject_id):
            print(f"Invalid subject ID format: {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Invalid subject ID format'}), 400
            
        try:
            weight_value = float(weight)
            print(f"Converted weight to float: {weight_value}")
        except ValueError:
            print(f"Invalid weight value (not a number): {weight}")
            return jsonify({'status': 'Error', 'message': 'Weight must be a valid number'}), 400
        
        # Try to find the subject first
        subject = db['Subject'].find_one({'_id': ObjectId(subject_id)})
        if not subject:
            print(f"Subject not found with ID: {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404
            
        print(f"Found subject: {subject.get('name')} (ID: {subject_id})")
        
        # Create weight measurement record
        weight_record = {
            "value": str(weight_value),
            "timestamp": datetime.now().isoformat(),
            "measured_by": userId,
            "method": method
        }
        
        # Prepare update operation
        update_operations = {}
        
        # If weight array already exists, push to it, otherwise create it
        if 'weight' in subject and isinstance(subject['weight'], list):
            update_operations['$push'] = {'weight': weight_record}
        else:
            update_operations['$set'] = {'weight': [weight_record]}
        
        # Set calculated_weight for easy access to the most recent value
        update_operations['$set'] = update_operations.get('$set', {})
        update_operations['$set']['calculated_weight'] = str(weight_value)
        update_operations['$set']['last_weight_update'] = datetime.now().isoformat()
        
        # Calculate BMI and malnutrition status if height is available
        if subject.get('height') and isinstance(subject['height'], list) and len(subject['height']) > 0:
            try:
                latest_height = subject['height'][0] if subject['height'][0].get('value') else subject['height'][-1]
                height_value = float(latest_height.get('value', 0))
                
                if height_value > 0:
                    height_m = height_value / 100  # Convert height from cm to meters
                    bmi = round(weight_value / (height_m * height_m), 2)
                    
                    # Create BMI record
                    bmi_record = {
                        "value": str(bmi),
                        "height": str(height_value),
                        "weight": str(weight_value),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # If bmi array already exists, push to it, otherwise create it
                    if 'bmi' in subject and isinstance(subject['bmi'], list):
                        if '$push' in update_operations:
                            update_operations['$push']['bmi'] = bmi_record
                        else:
                            update_operations['$push'] = {'bmi': bmi_record}
                    else:
                        update_operations['$set']['bmi'] = [bmi_record]
                    
                    # Calculate malnutrition status based on BMI
                    malnutrition_status = calculate_malnutrition_status(bmi, subject.get('age'), subject.get('gender'))
                    malnutrition_record = {
                        "value": malnutrition_status,
                        "timestamp": datetime.now().isoformat(),
                        "measured_by": userId,
                        "method": "Calculated"
                    }
                    
                    # If malnutrition_status array already exists, push to it, otherwise create it
                    if 'malnutrition_status' in subject and isinstance(subject['malnutrition_status'], list):
                        if '$push' in update_operations:
                            update_operations['$push']['malnutrition_status'] = malnutrition_record
                        else:
                            update_operations['$push'] = {'malnutrition_status': malnutrition_record}
                    else:
                        update_operations['$set']['malnutrition_status'] = [malnutrition_record]
            except Exception as bmi_error:
                print(f"Error calculating BMI or malnutrition status: {bmi_error}")
                # Continue with weight update even if BMI/malnutrition calculation fails
        
        # Update the subject with the new weight and related data
        update_result = db['Subject'].update_one(
            {'_id': ObjectId(subject_id)},
            update_operations
        )
        
        print(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
        
        if update_result.modified_count > 0:
            print(f"Successfully updated weight for subject {subject_id}")
            # Verify the update by retrieving the subject again
            updated_subject = db['Subject'].find_one({'_id': ObjectId(subject_id)})
            print(f"Updated subject data: weight={updated_subject.get('calculated_weight')}")
            return jsonify({
                'status': 'Success', 
                'message': 'Subject weight updated successfully',
                'subject': {
                    'id': str(subject_id),
                    'name': subject.get('name'),
                    'weight': str(weight_value)
                }
            })
        elif update_result.matched_count > 0:
            print(f"Subject found but no changes made to weight for subject {subject_id}")
            return jsonify({'status': 'Success', 'message': 'No changes made to subject weight'})
        else:
            print(f"Failed to update subject: no matching document found for ID {subject_id}")
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404
            
    except Exception as e:
        print(f"Error updating subject weight: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'Error', 'message': str(e)}), 500

@subjects_bp.route("/getMeasurementHistory", methods=['POST'])
def get_measurement_history():
    try:
        # Get data from request
        data = request.json
        subject_id = data.get('subjectId')
        
        # Validate subject_id
        if not subject_id or not ObjectId.is_valid(subject_id):
            return jsonify({'status': 'Error', 'message': 'Valid Subject ID is required'}), 400
        
        # Find the subject
        subject = db['Subject'].find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404
        
        # Get height, weight, BMI, and malnutrition status arrays
        height_array = subject.get('height', [])
        weight_array = subject.get('weight', [])
        bmi_array = subject.get('bmi', [])
        malnutrition_array = subject.get('malnutrition_status', [])
        
        # Convert to list if they're not already
        if not isinstance(height_array, list):
            height_array = [{"value": height_array, "timestamp": subject.get('last_height_update', datetime.now().isoformat())}]
        if not isinstance(weight_array, list):
            weight_array = [{"value": weight_array, "timestamp": subject.get('last_weight_update', datetime.now().isoformat())}]
        if not isinstance(bmi_array, list):
            # Create a single BMI record if possible
            if subject.get('height') and subject.get('weight'):
                bmi_array = [{
                    "value": subject.get('bmi', ''),
                    "height": subject.get('height', ''),
                    "weight": subject.get('weight', ''),
                    "timestamp": datetime.now().isoformat()
                }]
            else:
                bmi_array = []
        if not isinstance(malnutrition_array, list):
            malnutrition_array = [{"value": malnutrition_array, "timestamp": datetime.now().isoformat()}]
        
        # Sort arrays by timestamp (newest first)
        height_array.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        weight_array.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        bmi_array.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        malnutrition_array.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Format dates for display
        for record in height_array:
            if 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    pass
                    
        for record in weight_array:
            if 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    pass
                    
        for record in bmi_array:
            if 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    pass
                    
        for record in malnutrition_array:
            if 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    pass
        
        # Return the most recent records along with their histories
        return jsonify({
            'status': 'Success',
            'subjectId': subject_id,
            'height': height_array,
            'weight': weight_array,
            'bmi': bmi_array,
            'malnutrition_status': malnutrition_array
        })
        
    except Exception as e:
        print(f"Error retrieving measurement history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'Error', 'message': str(e)}), 500

@subjects_bp.route("/<id>/addNewSubject", methods=['POST'])
def add_new_subject(id):
    print("start---", id)
    try:
        # Convert the ID to an ObjectId and find the medical personnel by ID
        id_obj = ObjectId(id)
        print("object id", id_obj)

        mpc = db['Medical Personnel'].find_one({'_id': id_obj})
        if not mpc:
            return jsonify({'status': 'Error Occurred', 'message': 'Medical Personnel not found'})

        # Extract request body data
        body = request.form
        name = body.get('name')
        ageYears = body.get('age_years')
        ageMonths = body.get('age_months')
        gender = body.get('gender')
        state = body.get('stateArea')
        district = body.get('district')
        parent_name = body.get('parent_name')
        parent_phone_no = body.get('parent_phone_no')
        consent_var = body.get('consent')
        profile_picture = body.get('profilePicture')
        print(body)

        date = datetime.now().date()

        # Prepare subject data
        subject_data = {
            "name": name,
            "age": ageYears,
            "ageMonths": ageMonths,
            "date": str(date),
            "gender": gender,
            "district": district,
            "parent_name": parent_name,
            "parent_phone_no": parent_phone_no,
            "consent_var": consent_var,
            "state": state,
            "image_data": profile_picture,
            "mp": id,
            "admin": mpc['admin']
        }

        # Search for an existing subject by parent_phone_no and name
        existing_subject = db['Subject'].find_one({'parent_phone_no': parent_phone_no, 'name': name})

        if existing_subject:
            # If subject already exists, retain certain fields
            subject_data["height"] = existing_subject.get("height", [])
            subject_data["weight"] = existing_subject.get("weight", [])
            subject_data["calculated_height"] = existing_subject.get("calculated_height", '')
            subject_data["calculated_weight"] = existing_subject.get("calculated_weight", '')
            subject_data["malnutrition_status"] = existing_subject.get("malnutrition_status", [])
            subject_data["bmi"] = existing_subject.get("bmi", [])

            # Update the existing subject's data
            db['Subject'].update_one({'_id': existing_subject['_id']}, {'$set': subject_data})
            subject_id = existing_subject['_id']
        else:
            # If subject doesn't exist, initialize the additional fields
            subject_data["height"] = []
            subject_data["weight"] = []
            subject_data["calculated_height"] = ''
            subject_data["calculated_weight"] = ''
            subject_data["malnutrition_status"] = []
            subject_data["bmi"] = []

            # Insert the new subject data
            result = db['Subject'].insert_one(subject_data)
            subject_id = result.inserted_id

        # Train facial recognition
        try:
            # Get the image from MinIO
            image_url = f"http://127.0.0.1:9000/pmis-001/profilePictures/{profile_picture}"
            
            # For local development with self-signed certs
            response = requests.get(image_url, verify=False)
            if response.status_code == 200:
                image = Image.open(io.BytesIO(response.content))
                
                # Convert image to RGB (face_recognition requires RGB format)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Get face encodings
                face_image = np.array(image)
                face_locations = face_recognition.face_locations(face_image)
                
                if len(face_locations) > 0:
                    face_encodings = face_recognition.face_encodings(face_image, face_locations)
                    
                    # Save face encoding to database
                    face_data = {
                        "subject_id": subject_id,
                        "face_encoding": face_encodings[0].tolist(),  # Convert numpy array to list for MongoDB storage
                        "name": name,
                        "created_at": datetime.now()
                    }
                    
                    # Check if face data already exists for this subject
                    existing_face = db['FaceRecognition'].find_one({'subject_id': subject_id})
                    if existing_face:
                        db['FaceRecognition'].update_one(
                            {'subject_id': subject_id},
                            {'$set': face_data}
                        )
                    else:
                        db['FaceRecognition'].insert_one(face_data)
                    
                    print("Face recognition data saved successfully")
                else:
                    print("No face detected in the image")
            else:
                print(f"Failed to retrieve image: {response.status_code}")
        except Exception as face_error:
            print(f"Error in face recognition processing: {face_error}")
            # Continue with subject creation even if face recognition fails
            
        print("New or Updated Subject ID:", subject_id)
        return jsonify({'status': 'Success', 'id': str(subject_id)})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'Error Occurred', 'message': str(e)})

@subjects_bp.route("/getAllSubjects", methods=['GET'])
def get_all_subjects():
    try:
        id = request.args.get('id')

        query = {}
        if id:
            if not ObjectId.is_valid(id):
                return jsonify({"status": "Error", "message": "Invalid ID format"}), 400

            mp = db['Medical Personnel'].find_one({'_id': ObjectId(id)})
            admin = db['admin'].find_one({'_id': ObjectId(id)})
            orgMan = db['OrgManager'].find_one({'_id': ObjectId(id)})

            if mp:
                query['mp'] = id
            elif admin:
                query['admin'] = id
            elif orgMan:
                query = {}  # Organization Manager can see all subjects
            else:
                return jsonify({"status": "Error", "message": "No subjects found for the provided ID"}), 404

        # Get all subjects based on the query
        all_subjects = list(db['Subject'].find(query))
        
        if not all_subjects:
            return jsonify({"status": "Success", "data": []}), 200
            
        datajson = []
        for data in all_subjects:
            # Handle potentially missing fields safely
            mp_id = data.get('mp')
            admin_id = data.get('admin')
            
            mp = None
            admin = None
            
            if mp_id and ObjectId.is_valid(mp_id):
                mp = db['Medical Personnel'].find_one({'_id': ObjectId(mp_id)})
            
            if admin_id and ObjectId.is_valid(admin_id):
                admin = db['admin'].find_one({'_id': ObjectId(admin_id)})
            
            # Prepare the profile picture URL
            profile_pic_url = None
            if data.get('image_data'):
                profile_pic_url = f"http://127.0.0.1:9000/pmis-001/profilePictures/{data['image_data']}"
            
            # Get the latest malnutrition status if available
            malnutrition_status = ''
            if isinstance(data.get('malnutrition_status'), list) and data['malnutrition_status']:
                malnutrition_status = data['malnutrition_status'][0].get('value', '') if data['malnutrition_status'][0].get('value') else data['malnutrition_status'][-1].get('value', '')
            
            dataDict = {
                "name": data.get('name', ''),
                "age": data.get('age', ''),
                "ageMonths": data.get('ageMonths', ''),
                "gender": data.get('gender', ''),
                "date": data.get('date', ''),
                "parent_name": data.get('parent_name', ''),
                "district": data.get('district', ''),
                "parent_phone_no": data.get('parent_phone_no', ''),
                "state": data.get('state', ''),
                "height": data.get('calculated_height', ''),
                "og_height": data.get('height', []),
                "weight": data.get('calculated_weight', ''),
                "og_weight": data.get('weight', []),
                "malnutrition_status": malnutrition_status,
                "og_malnutrition_status": data.get('malnutrition_status', []),
                "bmi": data.get('bmi', []),
                "id": str(data['_id']),
                "mp_name": mp['name'] if mp else 'NA',
                "mp_phone": mp['phone'] if mp else 'NA',
                "admin_name": admin['name'] if admin else 'NA',
                "admin_phone": admin['phone'] if admin else 'NA',
                "profile_picture": data.get('image_data', ''),
                "profile_picture_url": profile_pic_url
            }
            datajson.append(dataDict)
        
        return jsonify({"status": "Success", "data": datajson}), 200
    except Exception as e:
        print(f"Error in getAllSubjects: {e}")
        return jsonify({"status": "Error", "message": str(e)}), 500

@subjects_bp.route("/<id>/<phone_number>/editSubject", methods=['POST'])
def edit_subject(id, phone_number):
    print("id:", id)
    print("phone_number:", phone_number)
    
    # Find the subject using the phone number
    res = db['Subject'].find_one({"parent_phone_no": phone_number})
    print(res)    
    if res:       
        # Extract height and weight from the form data
        height = request.form.get('height')
        weight = request.form.get('weight')
        print("ht wt", height, weight)
        image_file = request.form.get('height_image')
        age = res.get('age')
        gender = res.get('gender')
        mp_id = res.get('mp')
        print("dat gotten:", age, gender)

        cal = db['Calibration_Mp'].find_one({'mp_id': mp_id})
    
        focal_length = cal.get('focal_length')
        checkerboard_size = cal.get('checkerboard_size')
        print("Before")
        calculated_weight, calculated_height, bmi, malnutrition_status = charRecogAndDistDetect(checkerboard_size, focal_length, image_file, age, gender, height, weight)
        print("calculated dat ::::: ", calculated_height, calculated_weight)
        current_date = datetime.now().date().isoformat()
        
        if height and weight:
            # Create records for height, weight, BMI, and malnutrition status
            height_record = {
                "value": str(height),
                "timestamp": datetime.now().isoformat(),
                "measured_by": id,
                "method": "Manual Entry"
            }
            weight_record = {
                "value": str(weight),
                "timestamp": datetime.now().isoformat(),
                "measured_by": id,
                "method": "Manual Entry"
            }
            bmi_record = {
                "value": str(round(float(bmi), 2)),
                "height": str(height),
                "weight": str(weight),
                "timestamp": datetime.now().isoformat()
            }
            malnutrition_record = {
                "value": malnutrition_status,
                "timestamp": datetime.now().isoformat(),
                "measured_by": id,
                "method": "Calculated"
            }
            
            # Prepare update operations
            update_operations = {
                '$push': {
                    'height': height_record,
                    'weight': weight_record,
                    'bmi': bmi_record,
                    'malnutrition_status': malnutrition_record
                },
                '$set': {
                    'calculated_height': str(calculated_height),
                    'calculated_weight': str(calculated_weight),
                    'date': current_date
                }
            }
            
            print("updated_Data", update_operations)
            
            res = db['Subject'].update_one({"parent_phone_no": phone_number}, update_operations)
            print("res", res)
            # Retrieve the updated document
            updated_res = db['Subject'].find_one({"parent_phone_no": phone_number})
            print('updated_res', updated_res)
            # Return the updated document as a JSON response
            return jsonify({
                'status': 'Success',
                'id': id
            })
        else:
            return jsonify({
                'status': 'Error Occurred'
            })
    else:
        return jsonify({
            'status': 'Error Occurred'
        })

@subjects_bp.route("/<id>/editSubject", methods=['POST'])
def edit_subjectbyid(id):
    print("id:", id)
    
    try:
        # Convert `id` to ObjectId and find the subject by `id`
        subject = db['Subject'].find_one({"_id": ObjectId(id)})
        print("Subject Found:", subject)

        if subject:
            # Extract height and weight from the form data
            height = request.form.get('height')
            weight = request.form.get('weight')
            print("Height and Weight:", height, weight)
            image_file = request.form.get('height_image')

            # Get existing subject data
            age = subject.get('age')
            gender = subject.get('gender')
            mp_id = subject.get('mp')
            print("Subject Data:", age, gender)

            # Retrieve calibration data for medical personnel
            cal = db['Calibration_Mp'].find_one({'mp_id': mp_id})
            focal_length = cal.get('focal_length')
            checkerboard_size = cal.get('checkerboard_size')

            print("Before Calculation")
            calculated_weight, calculated_height, bmi, malnutrition_status = charRecogAndDistDetect(
                checkerboard_size, focal_length, image_file, age, gender, height, weight
            )
            print("Calculated Data:", calculated_height, calculated_weight)

            current_date = datetime.now().date().isoformat()

            # Update the document fields if height and weight are provided
            if height and weight:
                # Create records for height, weight, BMI, and malnutrition status
                height_record = {
                    "value": str(height),
                    "timestamp": datetime.now().isoformat(),
                    "measured_by": id,
                    "method": "Manual Entry"
                }
                weight_record = {
                    "value": str(weight),
                    "timestamp": datetime.now().isoformat(),
                    "measured_by": id,
                    "method": "Manual Entry"
                }
                bmi_record = {
                    "value": str(round(float(bmi), 2)),
                    "height": str(height),
                    "weight": str(weight),
                    "timestamp": datetime.now().isoformat()
                }
                malnutrition_record = {
                    "value": malnutrition_status,
                    "timestamp": datetime.now().isoformat(),
                    "measured_by": id,
                    "method": "Calculated"
                }
                
                # Prepare update operations
                update_operations = {
                    '$push': {
                        'height': height_record,
                        'weight': weight_record,
                        'bmi': bmi_record,
                        'malnutrition_status': malnutrition_record
                    },
                    '$set': {
                        'calculated_height': str(calculated_height),
                        'calculated_weight': str(calculated_weight),
                        'date': current_date
                    }
                }
                
                print("Updated Data:", update_operations)

                # Update the subject in the database
                res = db['Subject'].update_one({"_id": ObjectId(id)}, update_operations)
                print("Update Result:", res)

                # Retrieve the updated document
                updated_subject = db['Subject'].find_one({"_id": ObjectId(id)})
                print("Updated Subject:", updated_subject)

                # Return success response
                return jsonify({
                    'status': 'Success',
                    'id': id
                })
            else:
                return jsonify({
                    'status': 'Error Occurred',
                    'message': 'Height and weight must be provided'
                })
        else:
            return jsonify({
                'status': 'Error Occurred',
                'message': 'Subject not found'
            })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'status': 'Error Occurred',
            'message': str(e)
        })

@subjects_bp.route("/getphonesub", methods=['POST'])
def get_phone_subject():
    body = request.json
    phone = body.get('phone')
    try:
        # Use find() to get all subjects with the given parent_phone_no
        subjects = db['Subject'].find({'parent_phone_no': phone})

        # Convert the cursor to a list of dictionaries
        result = []
        for subject in subjects:
            # Get the latest malnutrition status if available
            malnutrition_status = ''
            if isinstance(subject.get('malnutrition_status'), list) and subject['malnutrition_status']:
                malnutrition_status = subject['malnutrition_status'][0].get('value', '') if subject['malnutrition_status'][0].get('value') else subject['malnutrition_status'][-1].get('value', '')
            
            result.append({
                "name": subject.get('name', ''),
                "age": subject.get('age', ''),
                "gender": subject.get('gender', ''),
                "parent_name": subject.get('parent_name', ''),
                "district": subject.get('district', ''),
                "parent_phone_no": subject.get('parent_phone_no', ''),
                "og_height": subject.get('height', []),
                "og_weight": subject.get('weight', []),
                "og_malnutrition_status": subject.get('malnutrition_status', []),
                "state": subject.get('state', ''),
            })

        # If no subjects are found, return an appropriate message
        if not result:
            return jsonify({'status': 'No subjects found', 'data': []})

        # Return the list of subjects
        return jsonify({'status': 'Success', 'data': result})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'Error occurred', 'message': str(e)})

@subjects_bp.route("/getsubjectbyimage", methods=['POST'])
def get_subject_by_image():
    try:
        # Check if an image file was uploaded
        if 'image' not in request.files:
            # Check if base64 image was sent in the request body
            if request.form.get('image'):
                # Get base64 image from form data
                image_data = request.form.get('image')
                # Remove data URI prefix if present
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                # Decode base64 to binary
                image_binary = base64.b64decode(image_data)
                img = Image.open(io.BytesIO(image_binary))
            else:
                return jsonify({
                    'status': 'Error',
                    'message': 'No image provided',
                    'data': []
                }), 400
        else:
            # Get image from request files
            image_file = request.files['image']
            img = Image.open(image_file)
        
        # Convert image to RGB (face_recognition requires RGB format)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get face encodings from the uploaded image
        face_image = np.array(img)
        face_locations = face_recognition.face_locations(face_image)
        
        if len(face_locations) == 0:
            return jsonify({
                'status': 'Error',
                'message': 'No face detected in the image',
                'data': []
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'Error',
                'message': 'Multiple faces detected. Please ensure only one face is in the image.',
                'data': []
            }), 400
        
        # Use the first face found in the image
        face_encodings = face_recognition.face_encodings(face_image, face_locations)
        unknown_face_encoding = face_encodings[0]
        
        # Retrieve all face encodings from the database
        all_face_data = list(db['FaceRecognition'].find())
        
        # Track the best match
        best_match = None
        lowest_distance = float('inf')
        
        # Compare the unknown face with stored faces
        for face_data in all_face_data:
            stored_encoding = np.array(face_data['face_encoding'])
            
            # Calculate face distance (lower distance means better match)
            face_distance = face_recognition.face_distance([stored_encoding], unknown_face_encoding)[0]
            
            # Check if this is a better match than the current best
            if face_distance < lowest_distance and face_distance < 0.6:  # 0.6 threshold
                lowest_distance = face_distance
                best_match = face_data
        
        # If we found a match, get the subject details
        if best_match:
            subject_id = best_match['subject_id']
            if isinstance(subject_id, str):
                subject_id = ObjectId(subject_id)
                
            subject = db['Subject'].find_one({'_id': subject_id})
            
            if subject:
                confidence_percentage = (1 - lowest_distance) * 100
                # Get the latest malnutrition status if available
                malnutrition_status = ''
                if isinstance(subject.get('malnutrition_status'), list) and subject['malnutrition_status']:
                    malnutrition_status = subject['malnutrition_status'][0].get('value', '') if subject['malnutrition_status'][0].get('value') else subject['malnutrition_status'][-1].get('value', '')
                
                # Return the matched subject with confidence level and subjectId
                return jsonify({
                    'status': 'Success',
                    'confidence': f"{confidence_percentage:.2f}%",
                    'data': [{
                        "id": str(subject['_id']),  # Include subjectId
                        "name": subject.get('name', ''),
                        "age": str(subject.get('age', '')),
                        "gender": subject.get('gender', ''),
                        "parent_name": subject.get('parent_name', ''),
                        "district": subject.get('district', ''),
                        "parent_phone_no": subject.get('parent_phone_no', ''),
                        "og_height": subject.get('height', []),
                        "og_weight": subject.get('weight', []),
                        "og_malnutrition_status": subject.get('malnutrition_status', []),
                        "state": subject.get('state', ''),
                    }]
                }), 200
        
        # No good match found
        return jsonify({
            'status': 'No subjects found',
            'message': 'No matching face found in the database.',
            'data': []
        }), 404
            
    except Exception as e:
        print(f"Error in face recognition: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'Error',
            'message': f'Face recognition failed: {str(e)}',
            'data': []
        }), 500
@subjects_bp.route("/getsubjectbyid", methods=['POST'])
def get_subject_by_id():
    body = request.json
    subject_id = body.get('id')  # Get the ID from the request body

    try:
        # Convert the ID to an ObjectId and find the subject by ID
        id_obj = ObjectId(subject_id)
        subject = db['Subject'].find_one({'_id': id_obj})
        print(f"Found subject by ID: {subject_id}", subject is not None)
        
        if not subject:
            return jsonify({'status': 'Error', 'message': 'Subject not found'}), 404

        # Extract subject details
        name = subject.get('name', '')
        age = subject.get('age', '')
        state = subject.get('state', '')
        gender = subject.get('gender', '')
        parent_name = subject.get('parent_name', '')
        district = subject.get('district', '')
        parent_phone_no = subject.get('parent_phone_no', '')
        
        # Process height and weight data
        og_height = subject.get('height', [])
        og_weight = subject.get('weight', [])
        calculated_height = subject.get('calculated_height', '')
        calculated_weight = subject.get('calculated_weight', '')
        
        # Ensure arrays for historical data
        if not isinstance(og_height, list):
            og_height = []
        if not isinstance(og_weight, list):
            og_weight = []
        
        # Get malnutrition status and BMI data
        malnutrition_status = subject.get('malnutrition_status', [])
        bmi = subject.get('bmi', [])
        
        # Ensure arrays for malnutrition and BMI
        if not isinstance(malnutrition_status, list):
            malnutrition_status = []
        if not isinstance(bmi, list):
            bmi = []

        # Print debug information about array lengths
        print(f"DEBUG - Original height array length: {len(og_height)}")
        print(f"DEBUG - Original weight array length: {len(og_weight)}")
        print(f"DEBUG - Original malnutrition array length: {len(malnutrition_status)}")
        print(f"DEBUG - Original BMI array length: {len(bmi)}")
        
        # Print first few items from each array for debugging
        if og_height:
            print(f"DEBUG - First height item: {og_height[0] if len(og_height) > 0 else 'None'}")
        if og_weight:
            print(f"DEBUG - First weight item: {og_weight[0] if len(og_weight) > 0 else 'None'}")
        if malnutrition_status:
            print(f"DEBUG - First malnutrition item: {malnutrition_status[0] if len(malnutrition_status) > 0 else 'None'}")

        # Get the latest malnutrition status if available
        latest_malnutrition = ''
        if malnutrition_status:
            if len(malnutrition_status) > 0:
                latest_item = malnutrition_status[0]
                if isinstance(latest_item, dict) and 'value' in latest_item:
                    latest_malnutrition = latest_item['value']
                elif isinstance(latest_item, str):
                    latest_malnutrition = latest_item

        # Sort arrays by timestamp (newest first) if they have timestamps
        if og_height and len(og_height) > 0 and isinstance(og_height[0], dict) and 'timestamp' in og_height[0]:
            og_height.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        if og_weight and len(og_weight) > 0 and isinstance(og_weight[0], dict) and 'timestamp' in og_weight[0]:
            og_weight.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        if malnutrition_status and len(malnutrition_status) > 0 and isinstance(malnutrition_status[0], dict) and 'timestamp' in malnutrition_status[0]:
            malnutrition_status.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        if bmi and len(bmi) > 0 and isinstance(bmi[0], dict) and 'timestamp' in bmi[0]:
            bmi.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

        # Format dates for display in arrays
        for record in og_height:
            if isinstance(record, dict) and 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    record['formatted_date'] = record.get('timestamp', '')
                    
        for record in og_weight:
            if isinstance(record, dict) and 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    record['formatted_date'] = record.get('timestamp', '')
                    
        for record in malnutrition_status:
            if isinstance(record, dict) and 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    record['formatted_date'] = record.get('timestamp', '')
                    
        for record in bmi:
            if isinstance(record, dict) and 'timestamp' in record:
                try:
                    dt = datetime.fromisoformat(record['timestamp'])
                    record['formatted_date'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    record['formatted_date'] = record.get('timestamp', '')        # Return the subject details
        response_data = {
            "status": "Success",
            "name": name,
            "age": age,
            "gender": gender,
            "parent_name": parent_name,
            "district": district,
            "parent_phone_no": parent_phone_no,
            "og_height": og_height,
            "og_weight": og_weight,
            "state": state,
            "calculated_height": calculated_height,
            "calculated_weight": calculated_weight,
            "malnutrition_status": latest_malnutrition,
            "og_malnutrition_status": malnutrition_status,
            "bmi": bmi
        }
        
        print("DEBUG - Sending data with heights count:", len(og_height))
        print("DEBUG - Sending data with weights count:", len(og_weight))
        print("DEBUG - Sending data with malnutrition count:", len(malnutrition_status))
        print("Sending response:", response_data.keys())
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in getsubjectbyid: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'Error',
            'message': str(e)
        }), 500

# Helper function to calculate malnutrition status
def calculate_malnutrition_status(bmi, age, gender):
    # Example logic for malnutrition status based on BMI, age, and gender
    # Adjust thresholds as per WHO or relevant guidelines
    try:
        bmi = float(bmi)
        age = float(age) if age else 0
        
        # Example thresholds for children (adjust as needed)
        if age < 18:
            if bmi < 16:
                return "Severe Undernutrition"
            elif 16 <= bmi < 18.5:
                return "Undernutrition"
            elif 18.5 <= bmi < 25:
                return "Normal"
            elif 25 <= bmi < 30:
                return "Overweight"
            else:
                return "Obese"
        else:
            # Adult thresholds
            if bmi < 18.5:
                return "Underweight"
            elif 18.5 <= bmi < 25:
                return "Normal"
            elif 25 <= bmi < 30:
                return "Overweight"
            else:
                return "Obese"
    except Exception as e:
        print(f"Error calculating malnutrition status: {e}")
        return "Unknown"

# You may also want to include the function to find medical personnel by ID in this file
def find_medical_personnel_by_id(id_obj):
    return db['Medical Personnel'].find_one({'_id': id_obj})