from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import logging
from config import config

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'production')
    app.config.from_object(config[config_name])
    
    # Configuration CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "https://turo-fleet-manager.netlify.app"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        from .routes import api_bp, main_bp
        app.register_blueprint(api_bp, url_prefix='/api')
        app.register_blueprint(main_bp)
        
        # Créer les tables si elles n'existent pas
        db.create_all()
    
    return app
