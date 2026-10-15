"""
MongoDB Database Connection Module for AutoDamage AI Pakistan.
Uses synchronous pymongo to integrate seamlessly with FastAPI endpoints.
Handles SSL errors gracefully with helpful diagnostic messages.
"""

import os
import ssl
import certifi
import pymongo
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError, ConfigurationError
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.environ.get("MONGODB_URI", "").strip()

client = None
db = None
users_collection = None
inspections_collection = None
sessions_collection = None

def init_mongodb():
    global client, db, users_collection, inspections_collection, sessions_collection

    if not MONGODB_URI:
        print("[WARNING] MONGODB_URI is not set in environment. MongoDB features will be unavailable.")
        print("[HINT] Add MONGODB_URI=mongodb+srv://... to your .env file")
        return

    # Try multiple connection strategies
    connection_opts = [
        # Strategy 1: Default with certifi (recommended)
        {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
            "socketTimeoutMS": 10000,
            "tlsCAFile": certifi.where(),
            "retryWrites": True,
        },
        # Strategy 2: With tls=True explicit
        {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
            "socketTimeoutMS": 10000,
            "tls": True,
            "tlsCAFile": certifi.where(),
        },
        # Strategy 3: Allow any SSL cert (last resort)
        {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
            "socketTimeoutMS": 10000,
            "tlsAllowInvalidCertificates": True,
        },
    ]

    last_error = None
    for idx, opts in enumerate(connection_opts):
        try:
            print(f"[INFO] Trying MongoDB connection strategy {idx + 1}...")
            test_client = MongoClient(MONGODB_URI, **opts)

            # Determine which database to use
            try:
                default_db = test_client.get_default_database()
                target_db = default_db if default_db is not None else test_client["autodamage_pakistan"]
            except Exception:
                target_db = test_client["autodamage_pakistan"]

            # Test the connection with a ping
            target_db.command("ping")

            # Connection succeeded — set globals
            client = test_client
            db = target_db
            users_collection = db["users"]
            inspections_collection = db["inspections"]
            sessions_collection = db["sessions"]

            # Create unique indexes
            try:
                users_collection.create_index("email", unique=True)
                users_collection.create_index("username", unique=True)
                print(f"[INFO] ✅ MongoDB connected successfully using strategy {idx + 1}!")
                print(f"[INFO] Database: {db.name}")
            except Exception as ie:
                print(f"[WARNING] Connected but index creation warning: {ie}")
                print(f"[INFO] ✅ MongoDB connected successfully using strategy {idx + 1}!")
            return  # Success!

        except ServerSelectionTimeoutError as e:
            last_error = e
            err_str = str(e)
            if "TLSV1_ALERT_INTERNAL_ERROR" in err_str or "SSL" in err_str:
                print(f"[WARNING] Strategy {idx + 1} failed -- SSL/TLS Error.")
                print("[HINT] This usually means your IP is NOT whitelisted in MongoDB Atlas.")
                print("[HINT] Go to: https://cloud.mongodb.com -> Security -> Network Access -> ADD IP ADDRESS")
                print("[HINT] Click 'ALLOW ACCESS FROM ANYWHERE' to add 0.0.0.0/0")
            else:
                print(f"[WARNING] Strategy {idx + 1} failed -- Server unreachable: {e}")
        except ConfigurationError as e:
            last_error = e
            print(f"[WARNING] Strategy {idx + 1} failed — Configuration error: {e}")
        except Exception as e:
            last_error = e
            print(f"[WARNING] Strategy {idx + 1} failed — {type(e).__name__}: {e}")

    # All strategies failed
    print(f"[ERROR] All MongoDB connection strategies failed.")
    print(f"[ERROR] Last error: {last_error}")
    print("[HINT] Please check:")
    print("  1. MongoDB Atlas Network Access → IP whitelist (add 0.0.0.0/0)")
    print("  2. Your MONGODB_URI password is correct")
    print("  3. Cluster is not paused in MongoDB Atlas")
    client = None
    db = None
    users_collection = None
    inspections_collection = None
    sessions_collection = None


init_mongodb()


def get_db():
    """Return the active MongoDB database instance, or None if not connected."""
    return db


def is_connected():
    """Check if MongoDB connection is active."""
    return db is not None


def get_connection_status():
    """Return a detailed status dict for health check endpoints."""
    if db is None:
        return {
            "connected": False,
            "message": "MongoDB not connected. Check MONGODB_URI and Atlas Network Access settings.",
            "hint": "Visit https://cloud.mongodb.com → Security → Network Access → Allow 0.0.0.0/0"
        }
    try:
        db.command("ping")
        return {
            "connected": True,
            "message": f"Connected to MongoDB Atlas ({db.name})",
            "database": db.name
        }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Connection lost: {str(e)}",
            "hint": "Restart the backend server"
        }
