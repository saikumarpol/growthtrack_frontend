account_sid = 'ACb1bc41424ced60985ea74094269e9b12'
auth_token = '0aae1c405505216c3e940eebd2d84788'
phone_number = '+17622487530'

from dotenv import load_dotenv
import os

# Load the environment variables from .env file
load_dotenv()

account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
phone_number = os.getenv('TWILIO_PHONE_NUMBER')
