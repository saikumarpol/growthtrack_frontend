from flask import Blueprint, jsonify, request
from pymongo import errors
from datetime import datetime
from database import db  # Import the db reference
from bson.objectid import ObjectId

admins_bp = Blueprint('admins', __name__)

def transform_admin_data(data):
    """Transform MongoDB admin data to a JSON-friendly format."""
    return {
        "name": data['name'],
        "phone": data['phone'],
        "email": data['email'],
        "district": data['district'],
        "state": data['state'],
        "verified": data['verified'],
        "date": data['date'],
        "id": str(data['_id'])
    }

def insert_admin(data):
    """Insert a new admin into the database."""
    return db['admin'].insert_one(data)

def find_admin_by_phone(phone):
    """Find an admin by phone number."""
    return db['admin'].find_one({'phone': phone})

@admins_bp.route("/signupAdmin", methods=['POST'])
def signupAdmin():
    body = request.json
    name = body.get('name')
    phone = body.get('phone')
    email = body.get('email')
    district = body.get('district')
    state = body.get('state')
    
    if not all([name, phone, district, state]):
        return jsonify({'status': 'Error', 'message': 'All fields are required.'}), 400

    date = datetime.now().date()
    data = {
        "date": str(date),
        "name": name,
        "phone": phone,
        "email": email,
        "district": district,
        "state": state,
        "verified": 2
    }

    try:
        # Check if the phone number already exists
        existing_admin = find_admin_by_phone(phone)
        if existing_admin:
            return jsonify({'status': 'Error', 'message': 'Phone number already registered.'}), 400

        # Insert the new admin
        inserted_id = insert_admin(data)
        return jsonify({'status': 'Success', 'inserted_id': str(inserted_id)}), 201
    except Exception as e:
        return jsonify({'status': 'Error', 'message': f'Failed to create admin: {str(e)}'}), 500


@admins_bp.route("/getPendingAdmins", methods=['GET'])
def get_pending_admin():
    try:
        all_admins = list(db['admin'].find({"verified": 2}))
        datajson = [transform_admin_data(data) for data in all_admins]
        return jsonify(datajson), 200
    except Exception as e:
        return jsonify({'status': 'Error', 'message': f'Failed to retrieve pending admins: {str(e)}'}), 500


@admins_bp.route("/getAllAdmins", methods=['GET'])
def get_all_admins():
    try:
        all_admins = list(db['admin'].find({"verified": 1}))
        datajson = [transform_admin_data(data) for data in all_admins]
        return jsonify(datajson), 200
    except Exception as e:
        return jsonify({'status': 'Error', 'message': f'Failed to retrieve all admins: {str(e)}'}), 500

@admins_bp.route("/<id>/verify",methods=['POST'])
def verify(id):
    #Checking if the superior is adding the MP or not
    try:
        id_obj = ObjectId(id)
        db['superior'].find_one({'_id': id_obj})        

        body=request.json
        admin=body.get('admin_id')
        option=body.get('option') # 0-> reject and 1-> accept
        print(admin)

        try:
            db['admin'].update_one(
                {'_id': ObjectId(admin)},
                {
                    '$set': {
                        "verified":option
                    }
                }
            )

            print("okok")
            return jsonify({
                'status':'Success'
            })
        except:
            return jsonify({
                'status':'Failed'
            })
        
    except:
        return jsonify({
                'status':'Superior unauthorized'
            })
    