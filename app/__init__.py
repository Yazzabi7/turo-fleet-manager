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

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Configuration CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "https://turo-fleet-manager.netlify.app"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
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
