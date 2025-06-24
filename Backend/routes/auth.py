from flask import Blueprint, request, jsonify

from datetime import datetime
from database import db 

auth_bp = Blueprint('auth', __name__)

def find_admin_by_phone(phone):
    """Find an admin by phone number."""
    return db['admin'].find_one({'phone': phone})

def find_medical_personnel_by_phone(phone):
    """Find medical personnel by phone number."""
    return db['Medical Personnel'].find_one({'phone': phone})

def find_superior_by_phone(phone):
    """Find medical personnel by phone number."""
    return db['superior'].find_one({'phone': phone})

def find_orgManager_by_phone(phone):
    """Find medical personnel by phone number."""
    return db['OrgManager'].find_one({'phone': phone})


@auth_bp.route("/login", methods=['POST'])
def login():
    body = request.json
    phone = body.get('phone')
    print("phone is:",phone)
    result_admin = find_admin_by_phone(phone)
    result_mp = find_medical_personnel_by_phone(phone)
    result_superior = find_superior_by_phone(phone)
    result_orgManager = find_orgManager_by_phone(phone)
    if result_admin:
        if result_admin['verified'] == 1:
            return jsonify({'id': str(result_admin['_id']), 'status': 'userFound', 'admin': 1})
        else:
            return jsonify({'status': 'Admin not verified'})
    
    elif result_mp:
        if result_mp['status'] == 1:
            return jsonify({'id': str(result_mp['_id']), 'status': 'userFound', 'admin': 0, 'calib_status':result_mp['calib_status']})
        else:
            return jsonify({'status': 'Medical Personnel not verified'})
    
    elif result_superior:
        return jsonify({'id': str(result_superior['_id']), 'status': 'userFound', 'admin': 2})
    
    elif result_orgManager:
        return jsonify({'id': str(result_orgManager['_id']), 'status': 'userFound', 'admin': 3})


    else:
        return jsonify({'status': 'User Not Found'})
