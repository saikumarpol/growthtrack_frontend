# from flask import Blueprint, jsonify, request
# from bson.objectid import ObjectId
# from twilio.rest import Client
# from database import db
# from . import keys

# message_bp = Blueprint('message', __name__)

# @message_bp.route("/message/<id>", methods=['POST'])
# def message(id):
#     try:
#         # Use silent=True to avoid 415 error if no JSON sent
#         data = request.get_json(silent=True) or {}
#         print("Received data:", data)  # Debug log

#         sub_id = ObjectId(id)
#         subject = db['Subject'].find_one({'_id': sub_id})

#         if not subject:
#             return jsonify({'status': 'subject not found'}), 404

#         # Extract fields, pulling 'value' from lists of dictionaries
#         name = subject['name']
#         age = subject['age']
#         date = subject['date']
#         gender = subject['gender']
#         district = subject['district']
#         height = subject['height'][0]['value'] if subject['height'] else 'N/A'
#         weight = subject['weight'][0]['value'] if subject['weight'] else 'N/A'
#         bmi = subject['bmi'][0]['value'] if subject['bmi'] else 'N/A'
#         malnutrition_status = subject['malnutrition_status'][0]['value'] if subject['malnutrition_status'] else 'N/A'
#         parent = subject['parent_name']
#         phone = subject['parent_phone_no']

#         # Compose bilingual SMS
#         message_body = (
#             f"Hello {parent},\n"
#             f"Here are your child's details:\n"
#             f"Name: {name}\n"
#             f"Age: {age}\n"
#             f"Gender: {gender}\n"
#             f"District: {district}\n"
#             f"Height: {height} cm\n"
#             f"Weight: {weight} kg\n"
#             f"BMI: {bmi}\n"
#             f"Malnutrition Status: {malnutrition_status}\n"
#             f"Date: {date}\n\n"
#             f"नमस्ते {parent},\n"
#             f"आपके बच्चे का विवरण:\n"
#             f"नाम: {name}\n"
#             f"आयु: {age}\n"
#             f"लिंग: {gender}\n"
#             f"जिला: {district}\n"
#             f"ऊँचाई: {height} सेमी\n"
#             f"वजन: {weight} कि.ग्रा\n"
#             f"बीएमआई: {bmi}\n"
#             f"कुपोषण स्थिति: {malnutrition_status}\n"
#             f"दिनांक: {date}"
#         )

#         # Send SMS via Twilio
#         cli = Client(keys.account_sid, keys.auth_token)
#         message = cli.messages.create(
#             body=message_body,
#             from_=keys.phone_number,
#             to='+91' + phone
#         )

#         print("SMS SID:", message.sid)
#         return jsonify({'status': 'message sent'})

#     except Exception as e:
#         print(f"Error sending SMS: {str(e)}")
#         return jsonify({'status': 'message not sent', 'error': str(e)}), 500




from flask import Blueprint, jsonify, request
from bson.objectid import ObjectId
from twilio.rest import Client
from database import db
from . import keys

message_bp = Blueprint('message', __name__)

@message_bp.route("/message/<id>", methods=['POST'])
def message(id):
    try:
        # Use silent=True to avoid 415 error if no JSON sent
        data = request.get_json(silent=True) or {}
        print("Received data:", data)  # Debug log

        sub_id = ObjectId(id)
        subject = db['Subject'].find_one({'_id': sub_id})

        if not subject:
            return jsonify({'status': 'subject not found'}), 404

        # Helper function to get the latest value from a list of dictionaries
        def get_latest_value(field_list, key='value'):
            if not field_list:
                return 'N/A'
            # Sort by timestamp (descending) and get the latest entry's value
            latest = sorted(field_list, key=lambda x: x['timestamp'], reverse=True)[0]
            return latest[key]

        # Extract fields, pulling the latest 'value' from lists
        name = subject['name']
        age = subject['age']
        date = subject['date']
        gender = subject['gender']
        district = subject['district']
        height = get_latest_value(subject['height'])
        weight = get_latest_value(subject['weight'])
        bmi = get_latest_value(subject['bmi'])
        malnutrition_status = get_latest_value(subject['malnutrition_status'])
        parent = subject['parent_name']
        phone = subject['parent_phone_no']

        # Compose bilingual SMS
        message_body = (
            f"Hello {parent},\n"
            f"Here are your child's details:\n"
            f"Name: {name}\n"
            f"Age: {age}\n"
            f"Gender: {gender}\n"
            f"District: {district}\n"
            f"Height: {height} cm\n"
            f"Weight: {weight} kg\n"
            f"BMI: {bmi}\n"
            f"Malnutrition Status: {malnutrition_status}\n"
            f"Date: {date}\n\n"
            f"नमस्ते {parent},\n"
            f"आपके बच्चे का विवरण:\n"
            f"नाम: {name}\n"
            f"आयु: {age}\n"
            f"लिंग: {gender}\n"
            f"जिला: {district}\n"
            f"ऊँचाई: {height} सेमी\n"
            f"वजन: {weight} कि.ग्रा\n"
            f"बीएमआई: {bmi}\n"
            f"कुपोषण स्थिति: {malnutrition_status}\n"
            f"दिनांक: {date}"
        )

        # Send SMS via Twilio
        cli = Client(keys.account_sid, keys.auth_token)
        message = cli.messages.create(
            body=message_body,
            from_=keys.phone_number,
            to='+91' + phone
        )

        print("SMS SID:", message.sid)
        return jsonify({'status': 'message sent'})

    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        return jsonify({'status': 'message not sent', 'error': str(e)}), 500
    