import pymongo
from config import Config

# Initialize the MongoDB client
client = pymongo.MongoClient(Config.MONGO_URI)

# Set the database reference
db = client.get_database('PMIS-001')

def init_db():
    """Reinitialize the database connection."""
    try:
        global db
        db = client.get_database('PMIS_001-v3')
        # Optional: Add a ping to test the connection
        db.command("ping")
        print("Database initialized successfully.")
    except pymongo.errors.ServerSelectionTimeoutError as e:
        print(f"Failed to connect to the database: {e}")

# Optional: Call init_db() if you want to ensure the connection is established at startup
init_db()