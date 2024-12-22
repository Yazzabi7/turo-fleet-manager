from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import logging

# Configuration du logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Chargement des variables d'environnement
load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuration CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///fleet.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_12345')
    
    db.init_app(app)
    migrate = Migrate(app, db)
    
    with app.app_context():
        from .routes import api_bp, main_bp
        app.register_blueprint(api_bp, url_prefix='/api')
        app.register_blueprint(main_bp)
        
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
    
    return app
