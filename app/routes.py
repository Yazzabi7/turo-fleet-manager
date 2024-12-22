from flask import jsonify, request, render_template, Blueprint
from .models import Vehicle, Maintenance, Cleaning, Rental, Reminder, Note, User, ActionHistory
from . import db
import logging
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps

# Création des blueprints
api_bp = Blueprint('api', __name__)
main_bp = Blueprint('main', __name__)

# Configuration JWT
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')  # À changer en production
JWT_EXPIRATION_HOURS = 24

def get_token_from_header():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'Token manquant'}), 401
            
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            request.current_user = User.query.get(payload['user_id'])
            if not request.current_user:
                return jsonify({'error': 'Utilisateur non trouvé'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expiré'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token invalide'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
        return f(*args, **kwargs)
    return decorated_function

def log_action(user_id, action_type, entity_type, entity_id, changes=None):
    try:
        # Si c'est une création ou une suppression, on ne compare pas les valeurs
        if action_type in ['create', 'delete']:
            changes_to_log = changes
        else:
            # Pour une mise à jour, on crée un dictionnaire de changements
            changes_to_log = {}
            if changes:
                for key, value in changes.items():
                    # Si la valeur est déjà au bon format (avec old et new), on la garde
                    if isinstance(value, dict) and 'old' in value and 'new' in value:
                        changes_to_log[key] = value
                    else:
                        if entity_type == 'vehicle':
                            entity = Vehicle.query.get(entity_id)
                        elif entity_type == 'note':
                            entity = Note.query.get(entity_id)
                        elif entity_type == 'maintenance':
                            entity = Maintenance.query.get(entity_id)
                        else:
                            continue

                        if entity and hasattr(entity, key):
                            old_value = getattr(entity, key)
                            if old_value != value:
                                changes_to_log[key] = {
                                    'old': str(old_value),
                                    'new': str(value)
                                }

        action = ActionHistory(
            user_id=user_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes_to_log
        )
        db.session.add(action)
        db.session.commit()
    except Exception as e:
        logging.error(f"Erreur lors de l'enregistrement de l'action: {str(e)}")
        db.session.rollback()

# Route d'accueil
@main_bp.route('/')
def index():
    return render_template('static/index.html')

# Route de test pour vérifier que l'API fonctionne
@main_bp.route('/test')
def test():
    try:
        return jsonify({"status": "success", "message": "L'API fonctionne correctement"})
    except Exception as e:
        logging.error(f"Error in test: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes d'authentification
@api_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validation des données
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Vérification de l'unicité
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Nom d\'utilisateur déjà utilisé'}), 400
            
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email déjà utilisé'}), 400
            
        # Création de l'utilisateur
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Création du token pour connexion automatique
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }, JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'message': 'Utilisateur créé avec succès',
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validation des données
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Nom d\'utilisateur et mot de passe requis'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user is None or not user.check_password(data['password']):
            return jsonify({'error': 'Nom d\'utilisateur ou mot de passe incorrect'}), 401
            
        # Création du token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }, JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/me', methods=['GET'])
@login_required
def get_current_user():
    try:
        return jsonify(request.current_user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id')
    
    query = ActionHistory.query
    
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    if entity_id:
        query = query.filter_by(entity_id=entity_id)
        
    actions = query.order_by(ActionHistory.created_at.desc()).all()
    return jsonify([action.to_dict() for action in actions])

@api_bp.route('/history', methods=['DELETE'])
@login_required
def clear_history():
    try:
        # Supprimer tout l'historique
        ActionHistory.query.delete()
        db.session.commit()
        return jsonify({'message': 'Historique supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles', methods=['GET'])
@login_required
def get_vehicles():
    try:
        vehicles = Vehicle.query.all()
        return jsonify([{
            'id': v.id,
            'brand': v.brand,
            'model': v.model,
            'year': v.year,
            'license_plate': v.license_plate,
            'status': v.status,
            'parking_spot': v.parking_spot
        } for v in vehicles])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:id>', methods=['GET'])
@login_required
def get_vehicle(id):
    try:
        vehicle = Vehicle.query.get_or_404(id)
        return jsonify({
            'id': vehicle.id,
            'brand': vehicle.brand,
            'model': vehicle.model,
            'year': vehicle.year,
            'license_plate': vehicle.license_plate,
            'status': vehicle.status,
            'parking_spot': vehicle.parking_spot
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles', methods=['POST'])
@login_required
def create_vehicle():
    try:
        data = request.get_json()
        
        # Vérification si la place de parking est déjà utilisée
        if data.get('parking_spot'):
            existing_vehicle = Vehicle.query.filter_by(parking_spot=data['parking_spot']).first()
            if existing_vehicle:
                return jsonify({'error': f'La place de parking {data["parking_spot"]} est déjà occupée par le véhicule {existing_vehicle.brand} {existing_vehicle.model}'}), 400
        
        vehicle = Vehicle(
            brand=data['brand'],
            model=data['model'],
            year=data['year'],
            license_plate=data['license_plate'],
            status=data.get('status', 'available'),
            parking_spot=data.get('parking_spot')
        )
        
        db.session.add(vehicle)
        db.session.commit()
        
        # Log de l'action
        log_action(
            user_id=request.current_user.id,
            action_type='create',
            entity_type='vehicle',
            entity_id=vehicle.id,
            changes=data
        )
        
        return jsonify({'vehicle': vehicle.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>', methods=['PUT'])
@login_required
def update_vehicle(vehicle_id):
    try:
        vehicle = Vehicle.query.get_or_404(vehicle_id)
        data = request.get_json()
        logging.debug(f"Updating vehicle {vehicle_id} with data: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Vérifier si la nouvelle plaque existe déjà (sauf pour le véhicule actuel)
        if 'license_plate' in data and data['license_plate'] != vehicle.license_plate:
            existing_vehicle = Vehicle.query.filter_by(license_plate=data['license_plate']).first()
            if existing_vehicle:
                return jsonify({'error': 'Cette plaque d\'immatriculation existe déjà'}), 400
        
        # Vérifier si la place de parking est déjà occupée par un autre véhicule
        if data.get('parking_spot') and data['parking_spot'] != vehicle.parking_spot:
            existing_vehicle = Vehicle.query.filter_by(parking_spot=data['parking_spot']).first()
            if existing_vehicle:
                return jsonify({
                    'error': 'Place de parking déjà occupée',
                    'details': f'La place {data["parking_spot"]} est déjà occupée par le véhicule {existing_vehicle.license_plate}'
                }), 400

        # Mise à jour des champs
        changes = {}
        if 'brand' in data:
            if vehicle.brand != data['brand']:
                changes['brand'] = {'old': vehicle.brand, 'new': data['brand']}
            vehicle.brand = data['brand']
        if 'model' in data:
            if vehicle.model != data['model']:
                changes['model'] = {'old': vehicle.model, 'new': data['model']}
            vehicle.model = data['model']
        if 'year' in data:
            try:
                new_year = int(data['year'])
                if vehicle.year != new_year:
                    changes['year'] = {'old': vehicle.year, 'new': new_year}
                vehicle.year = new_year
            except (ValueError, TypeError):
                return jsonify({'error': 'L\'année doit être un nombre valide'}), 400
        if 'license_plate' in data:
            if vehicle.license_plate != data['license_plate']:
                changes['license_plate'] = {'old': vehicle.license_plate, 'new': data['license_plate']}
            vehicle.license_plate = data['license_plate']
        if 'status' in data:
            if vehicle.status != data['status']:
                changes['status'] = {'old': vehicle.status, 'new': data['status']}
            vehicle.status = data['status']
        if 'parking_spot' in data:
            old_spot = vehicle.parking_spot or '-'
            new_spot = data['parking_spot'] or '-'
            if old_spot != new_spot:
                changes['parking_spot'] = {'old': old_spot, 'new': new_spot}
            vehicle.parking_spot = data['parking_spot']
        
        db.session.commit()
        
        # Log de l'action
        if changes:  # Ne log que s'il y a des changements
            log_action(
                user_id=request.current_user.id,
                action_type='update',
                entity_type='vehicle',
                entity_id=vehicle.id,
                changes=changes
            )
        
        return jsonify({
            'message': 'Vehicle updated successfully',
            'vehicle': {
                'id': vehicle.id,
                'brand': vehicle.brand,
                'model': vehicle.model,
                'year': vehicle.year,
                'license_plate': vehicle.license_plate,
                'status': vehicle.status,
                'parking_spot': vehicle.parking_spot
            }
        })
        
    except Exception as e:
        logging.error(f"Error in update_vehicle: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    try:
        vehicle = Vehicle.query.get_or_404(vehicle_id)
        
        # Supprimer d'abord les enregistrements liés
        Maintenance.query.filter_by(vehicle_id=vehicle_id).delete()
        Cleaning.query.filter_by(vehicle_id=vehicle_id).delete()
        Rental.query.filter_by(vehicle_id=vehicle_id).delete()
        
        # Puis supprimer le véhicule
        db.session.delete(vehicle)
        db.session.commit()
        
        # Log de l'action
        log_action(
            user_id=request.current_user.id,
            action_type='delete',
            entity_type='vehicle',
            entity_id=vehicle_id
        )
        
        return jsonify({'message': 'Véhicule supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erreur lors de la suppression du véhicule {vehicle_id}: {str(e)}")
        return jsonify({'error': 'Erreur lors de la suppression du véhicule'}), 500

# Routes pour les maintenances
@api_bp.route('/maintenances', methods=['GET'])
@login_required
def get_maintenances():
    try:
        maintenances = Maintenance.query.all()
        return jsonify([{
            'id': m.id,
            'vehicle_id': m.vehicle_id,
            'type': m.type,
            'description': m.description,
            'date': m.date.isoformat(),
            'status': m.status
        } for m in maintenances])
    except Exception as e:
        logging.error(f"Error in get_maintenances: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/maintenances', methods=['POST'])
@login_required
def create_maintenance():
    try:
        data = request.get_json()
        maintenance = Maintenance(
            vehicle_id=data['vehicle_id'],
            type=data['type'],
            description=data.get('description'),
            date=datetime.fromisoformat(data['date']),
            status=data.get('status', 'scheduled')
        )
        db.session.add(maintenance)
        db.session.commit()
        
        # Log de l'action
        log_action(
            user_id=request.current_user.id,
            action_type='create',
            entity_type='maintenance',
            entity_id=maintenance.id,
            changes=data
        )
        
        return jsonify({'message': 'Maintenance created successfully', 'id': maintenance.id}), 201
    except Exception as e:
        logging.error(f"Error in create_maintenance: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Routes pour les locations
@api_bp.route('/rentals', methods=['GET'])
@login_required
def get_rentals():
    try:
        rentals = Rental.query.all()
        return jsonify([{
            'id': r.id,
            'vehicle_id': r.vehicle_id,
            'start_date': r.start_date.isoformat(),
            'end_date': r.end_date.isoformat(),
            'turo_booking_id': r.turo_booking_id,
            'status': r.status
        } for r in rentals])
    except Exception as e:
        logging.error(f"Error in get_rentals: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les rappels
@api_bp.route('/reminders', methods=['GET'])
@login_required
def get_reminders():
    try:
        reminders = Reminder.query.filter_by(status='pending').all()
        return jsonify([{
            'id': r.id,
            'vehicle_id': r.vehicle_id,
            'type': r.type,
            'description': r.description,
            'due_date': r.due_date.isoformat(),
            'status': r.status
        } for r in reminders])
    except Exception as e:
        logging.error(f"Error in get_reminders: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Route pour le tableau de bord
@api_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard_stats():
    try:
        stats = {
            'total_vehicles': Vehicle.query.count(),
            'available_vehicles': Vehicle.query.filter_by(status='available').count(),
            'rented_vehicles': Vehicle.query.filter_by(status='rented').count(),
            'maintenance_vehicles': Vehicle.query.filter_by(status='maintenance').count(),
            'needs_repair': Vehicle.query.filter_by(status='needs_repair').count(),
            'needs_cleaning': Vehicle.query.filter_by(status='needs_cleaning').count(),
            'active_rentals': Rental.query.filter_by(status='active').count(),
            'pending_maintenances': Maintenance.query.filter_by(status='scheduled').count(),
            'pending_cleanings': Cleaning.query.filter_by(status='scheduled').count()
        }
        return jsonify(stats)
    except Exception as e:
        app.logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des statistiques'}), 500

# Routes pour les notes
@api_bp.route('/vehicles/<int:vehicle_id>/notes', methods=['GET'])
@login_required
def get_vehicle_notes(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    return jsonify([note.to_dict() for note in vehicle.notes])

@api_bp.route('/vehicles/<int:vehicle_id>/notes', methods=['POST'])
@login_required
def add_vehicle_note(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Le contenu de la note est requis'}), 400
        
    note = Note(
        vehicle_id=vehicle_id,
        content=data['content']
    )
    
    db.session.add(note)
    db.session.commit()
    
    # Log de l'action
    log_action(
        user_id=request.current_user.id,
        action_type='create',
        entity_type='note',
        entity_id=note.id,
        changes=data
    )
    
    return jsonify(note.to_dict()), 201

@api_bp.route('/vehicles/<int:vehicle_id>/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_vehicle_note(vehicle_id, note_id):
    note = Note.query.filter_by(id=note_id, vehicle_id=vehicle_id).first_or_404()
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Le contenu de la note est requis'}), 400
        
    note.content = data['content']
    db.session.commit()
    
    # Log de l'action
    log_action(
        user_id=request.current_user.id,
        action_type='update',
        entity_type='note',
        entity_id=note.id,
        changes=data
    )
    
    return jsonify(note.to_dict())

@api_bp.route('/vehicles/<int:vehicle_id>/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_vehicle_note(vehicle_id, note_id):
    note = Note.query.filter_by(id=note_id, vehicle_id=vehicle_id).first_or_404()
    db.session.delete(note)
    db.session.commit()
    
    # Log de l'action
    log_action(
        user_id=request.current_user.id,
        action_type='delete',
        entity_type='note',
        entity_id=note_id
    )
    
    return '', 204
