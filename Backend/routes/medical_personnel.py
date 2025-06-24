from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from database import db  # Import the db reference

medical_personnel_bp = Blueprint('medical_personnel', __name__)

def insert_medical_personnel(data):
    """Insert a new medical personnel into the database."""
    print("inserting:")
    return db['Medical Personnel'].insert_one(data)

def update_medical_personnel(phone, data):
    """Update existing medical personnel by phone number."""
    return db['Medical Personnel'].update_one({'phone': phone}, {'$set': data}, upsert=True)

def find_medical_personnel_by_phone(phone):
    """Find medical personnel by phone number."""
    return db['Medical Personnel'].find_one({'phone': phone})

@medical_personnel_bp.route("/<id>/addMedicalPersonnel", methods=['POST'])
def add_medical_personnel(id):
    body = request.json

    print("hello:",body)
    data = {
        "name": body.get('name'),
        "phone": body.get('phone'),
        "email": body.get('email'),
        "district": body.get('district'),
        "state": body.get('state'),
        "admin": body.get('admin'),
        "calib_status": 0,
        "status": 1
    }
    print("hello again")
    try:
        # Check if the phone number already exists
        if find_medical_personnel_by_phone(data['phone']):
            return jsonify({'status': 'Error', 'message': 'Medical personnel with this phone number already exists.'}), 400
        
        # Insert or update medical personnel
        insert_medical_personnel(data)
        return jsonify({'status': 'Success'}), 200
    except Exception as e:
        return jsonify({'status': f'Error: {str(e)}'}), 500


@medical_personnel_bp.route("/getAllMedicalPersonnel", methods=['GET'])
def get_all_mp():
    try:
        all_mp = db['Medical Personnel'].find({"status": 1})
        datajson = []

        for data in all_mp:
            id = str(data['_id'])
            admin_id = ObjectId(data['admin'])

            admin = db['admin'].find_one({'_id': admin_id})
            admin_name = admin['name'] if admin else 'NA'
            admin_phone = admin['phone'] if admin else 'NA'

            dataDict = {
                "name": data['name'],
                "phone": data['phone'],
                "email": data['email'],
                "district": data['district'],
                "state": data['state'],
                "id": id,
                "admin_name": admin_name,
                "admin_phone": admin_phone,
                "status": data['status']
            }
            datajson.append(dataDict)
        return jsonify(datajson), 200
    except Exception as e:
        return jsonify({'status': 'Error', 'message': f'Failed to retrieve medical personnel: {str(e)}'}), 500


@medical_personnel_bp.route("/getMedicalPersonnelByAdmin", methods=['GET'])
def get_mp_by_admin():
    admin_id = request.args.get('admin_id')  # Get the admin_id from query parameters

    if not admin_id:
        return jsonify({'status': 'Error', 'message': 'admin_id is required'}), 400

    try:
        # Ensure admin_id is a valid ObjectId
        admin_id_obj = str(admin_id)
        print("admin:",admin_id_obj)
        # Find medical personnel associated with the given admin ID
        mp_list = db['Medical Personnel'].find({"admin": admin_id_obj, "status": 1})
        datajson = []

        for data in mp_list:
            id = str(data['_id'])
            dataDict = {
                "name": data['name'],
                "phone": data['phone'],
                "email": data['email'],
                "district": data['district'],
                "state": data['state'],
                "id": id,
                "status": data['status']
            }
            datajson.append(dataDict)
        return jsonify(datajson), 200
    except Exception as e:
        return jsonify({'status': 'Error', 'message': f'Failed to retrieve medical personnel: {str(e)}'}), 500


@medical_personnel_bp.route('/uploadMultipleMedicalPersonnel', methods=['POST'])
def upload_multiple_medical_personnel():
    try:
        data = request.json.get('data')
        admin_id = request.json.get('id')

        if not data:
            return jsonify({'message': 'No data provided'}), 400

        headers = data[0]
        rows = data[1:]

        for row in rows:
            if row[0] and row[1]:
                phone_number = row[1]
                if db['Medical Personnel'].find_one({"phone": phone_number}):
                    continue
                
                data_to_insert = {
                    "name": row[0],
                    "phone": row[1],
                    "email": row[2],
                    "district": row[3],
                    "state": row[4],
                    "admin": admin_id,
                    "calib_status": 0,
                    "status": 1
                }
                insert_medical_personnel(data_to_insert)  # Insert new personnel
        return jsonify({'message': 'Data received and inserted successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error processing data: {str(e)}'}), 500

# Accept or reject mp
@medical_personnel_bp.route("/<id>/verifymp",methods=['POST'])
def verifymp(id):
    try:
        id_obj = ObjectId(id)
        db['superior'].find_one({'_id': id_obj})     

        body=request.json
        mp=body.get('mp_id')
        option=body.get('option') # 0-> reject and 1-> accept
        print(mp)

        try:
            db['Medical Personnel'].update_one(
                {'_id': ObjectId(mp)},
                {
                    '$set': {
                        "status":option
                    }
                }
            )

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
    