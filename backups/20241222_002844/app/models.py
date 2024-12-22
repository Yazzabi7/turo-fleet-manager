from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    license_plate = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, rented, maintenance, needs_repair, needs_cleaning
    parking_spot = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    maintenances = db.relationship('Maintenance', backref='vehicle', lazy=True)
    cleanings = db.relationship('Cleaning', backref='vehicle', lazy=True)
    rentals = db.relationship('Rental', backref='vehicle', lazy=True)
    notes = db.relationship('Note', backref='vehicle', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'license_plate': self.license_plate,
            'status': self.status,
            'parking_spot': self.parking_spot,
            'notes': [note.to_dict() for note in self.notes]
        }

class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Cleaning(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # basic, deep
    date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Rental(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    turo_booking_id = db.Column(db.String(50), unique=True)
    status = db.Column(db.String(20), default='upcoming')  # upcoming, active, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # maintenance, cleaning, insurance, etc.
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    actions = db.relationship('ActionHistory', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class ActionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # create, update, delete
    entity_type = db.Column(db.String(50), nullable=False)  # vehicle, note, etc.
    entity_id = db.Column(db.Integer, nullable=False)
    changes = db.Column(db.JSON)  # stocke les modifications {field: {old: value, new: value}}
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user.username,
            'action_type': self.action_type,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'changes': self.changes,
            'created_at': self.created_at.isoformat()
        }
