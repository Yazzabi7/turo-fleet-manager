from flask import jsonify, request, send_from_directory, Blueprint
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

# Routes principales - Toutes retournent index.html car React gère les routes côté client
@main_bp.route('/')
@main_bp.route('/login')
@main_bp.route('/register')
@main_bp.route('/dashboard')
@main_bp.route('/vehicles')
@main_bp.route('/vehicles/<int:id>')
@main_bp.route('/vehicles/add')
@main_bp.route('/vehicles/edit/<int:id>')
@main_bp.route('/maintenance')
@main_bp.route('/maintenance/add')
@main_bp.route('/maintenance/<int:id>')
@main_bp.route('/rentals')
@main_bp.route('/rentals/add')
@main_bp.route('/rentals/<int:id>')
@main_bp.route('/history')
@main_bp.route('/settings')
@main_bp.route('/profile')
def serve_app(id=None):
    return send_from_directory('static', 'index.html')

# Route pour servir les fichiers statiques
@main_bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

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
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({'error': 'Tous les champs sont requis'}), 400

        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Cet email est déjà utilisé'}), 400

        # Créer le nouvel utilisateur
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'Inscription réussie'}), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in register: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logging.info(f"Login attempt with data: {data}")
        
        # Validation des données
        if not data or 'username' not in data or 'password' not in data:
            logging.warning("Missing username or password in request")
            return jsonify({'error': 'Nom d\'utilisateur et mot de passe requis'}), 400
        
        # On cherche l'utilisateur par email ou username
        user = User.query.filter(
            (User.email == data['username']) | (User.username == data['username'])
        ).first()
        
        if user is None:
            logging.warning(f"No user found with username/email: {data['username']}")
            return jsonify({'error': 'Nom d\'utilisateur ou mot de passe incorrect'}), 401
            
        if not user.check_password(data['password']):
            logging.warning(f"Invalid password for user: {user.username}")
            return jsonify({'error': 'Nom d\'utilisateur ou mot de passe incorrect'}), 401
            
        # Création du token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }, JWT_SECRET_KEY, algorithm='HS256')
        
        logging.info(f"Successful login for user: {user.username}")
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Error in login: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': request.current_user.id,
        'name': request.current_user.name,
        'email': request.current_user.email
    })

# Routes pour l'historique
@api_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    try:
        history = ActionHistory.query.filter_by(user_id=request.current_user.id).order_by(ActionHistory.timestamp.desc()).all()
        return jsonify([{
            'id': action.id,
            'action_type': action.action_type,
            'entity_type': action.entity_type,
            'entity_id': action.entity_id,
            'changes': action.changes,
            'timestamp': action.timestamp.isoformat()
        } for action in history])
    except Exception as e:
        logging.error(f"Error in get_history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/history/clear', methods=['POST'])
@login_required
def clear_history():
    try:
        ActionHistory.query.filter_by(user_id=request.current_user.id).delete()
        db.session.commit()
        return jsonify({'message': 'Historique effacé avec succès'})
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in clear_history: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les véhicules
@api_bp.route('/vehicles', methods=['GET'])
@login_required
def get_vehicles():
    try:
        vehicles = Vehicle.query.all()
        return jsonify([{
            'id': vehicle.id,
            'name': vehicle.name,
            'model': vehicle.model,
            'year': vehicle.year,
            'status': vehicle.status
        } for vehicle in vehicles])
    except Exception as e:
        logging.error(f"Error in get_vehicles: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:id>', methods=['GET'])
@login_required
def get_vehicle(id):
    try:
        vehicle = Vehicle.query.get_or_404(id)
        return jsonify({
            'id': vehicle.id,
            'name': vehicle.name,
            'model': vehicle.model,
            'year': vehicle.year,
            'status': vehicle.status
        })
    except Exception as e:
        logging.error(f"Error in get_vehicle: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles', methods=['POST'])
@login_required
def create_vehicle():
    try:
        data = request.get_json()
        
        required_fields = ['name', 'model', 'year']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Tous les champs requis doivent être remplis'}), 400
            
        new_vehicle = Vehicle(
            name=data['name'],
            model=data['model'],
            year=data['year'],
            status=data.get('status', 'available')
        )
        
        db.session.add(new_vehicle)
        db.session.commit()
        
        # Log the action
        log_action(
            user_id=request.current_user.id,
            action_type='create',
            entity_type='vehicle',
            entity_id=new_vehicle.id,
            changes={
                'name': new_vehicle.name,
                'model': new_vehicle.model,
                'year': new_vehicle.year,
                'status': new_vehicle.status
            }
        )
        
        return jsonify({
            'message': 'Véhicule créé avec succès',
            'vehicle': {
                'id': new_vehicle.id,
                'name': new_vehicle.name,
                'model': new_vehicle.model,
                'year': new_vehicle.year,
                'status': new_vehicle.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in create_vehicle: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>', methods=['PUT'])
@login_required
def update_vehicle(vehicle_id):
    try:
        vehicle = Vehicle.query.get_or_404(vehicle_id)
        data = request.get_json()
        
        # Track changes for history
        changes = {}
        
        # Update only if field is present in request
        if 'name' in data and data['name'] != vehicle.name:
            changes['name'] = {
                'old': vehicle.name,
                'new': data['name']
            }
            vehicle.name = data['name']
            
        if 'model' in data and data['model'] != vehicle.model:
            changes['model'] = {
                'old': vehicle.model,
                'new': data['model']
            }
            vehicle.model = data['model']
            
        if 'year' in data and data['year'] != vehicle.year:
            changes['year'] = {
                'old': vehicle.year,
                'new': data['year']
            }
            vehicle.year = data['year']
            
        if 'status' in data and data['status'] != vehicle.status:
            changes['status'] = {
                'old': vehicle.status,
                'new': data['status']
            }
            vehicle.status = data['status']
        
        # Only commit if there are changes
        if changes:
            db.session.commit()
            
            # Log the action
            log_action(
                user_id=request.current_user.id,
                action_type='update',
                entity_type='vehicle',
                entity_id=vehicle.id,
                changes=changes
            )
            
            return jsonify({
                'message': 'Véhicule mis à jour avec succès',
                'vehicle': {
                    'id': vehicle.id,
                    'name': vehicle.name,
                    'model': vehicle.model,
                    'year': vehicle.year,
                    'status': vehicle.status
                },
                'changes': changes
            })
        else:
            return jsonify({'message': 'Aucun changement détecté'})
            
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in update_vehicle: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    try:
        vehicle = Vehicle.query.get_or_404(vehicle_id)
        
        # Store vehicle info before deletion for history
        vehicle_info = {
            'name': vehicle.name,
            'model': vehicle.model,
            'year': vehicle.year,
            'status': vehicle.status
        }
        
        db.session.delete(vehicle)
        db.session.commit()
        
        # Log the action
        log_action(
            user_id=request.current_user.id,
            action_type='delete',
            entity_type='vehicle',
            entity_id=vehicle_id,
            changes=vehicle_info
        )
        
        return jsonify({'message': 'Véhicule supprimé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in delete_vehicle: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les maintenances
@api_bp.route('/maintenances', methods=['GET'])
@login_required
def get_maintenances():
    try:
        maintenances = Maintenance.query.all()
        return jsonify([{
            'id': maintenance.id,
            'vehicle_id': maintenance.vehicle_id,
            'type': maintenance.type,
            'date': maintenance.date.isoformat(),
            'notes': maintenance.notes
        } for maintenance in maintenances])
    except Exception as e:
        logging.error(f"Error in get_maintenances: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/maintenances', methods=['POST'])
@login_required
def create_maintenance():
    try:
        data = request.get_json()
        
        required_fields = ['vehicle_id', 'type', 'date']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Tous les champs requis doivent être remplis'}), 400
            
        new_maintenance = Maintenance(
            vehicle_id=data['vehicle_id'],
            type=data['type'],
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_maintenance)
        db.session.commit()
        
        return jsonify({
            'message': 'Maintenance créée avec succès',
            'maintenance': {
                'id': new_maintenance.id,
                'vehicle_id': new_maintenance.vehicle_id,
                'type': new_maintenance.type,
                'date': new_maintenance.date.isoformat(),
                'notes': new_maintenance.notes
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in create_maintenance: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les locations
@api_bp.route('/rentals', methods=['GET'])
@login_required
def get_rentals():
    try:
        rentals = Rental.query.all()
        return jsonify([{
            'id': rental.id,
            'vehicle_id': rental.vehicle_id,
            'start_date': rental.start_date.isoformat(),
            'end_date': rental.end_date.isoformat() if rental.end_date else None,
            'status': rental.status
        } for rental in rentals])
    except Exception as e:
        logging.error(f"Error in get_rentals: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les rappels
@api_bp.route('/reminders', methods=['GET'])
@login_required
def get_reminders():
    try:
        reminders = Reminder.query.all()
        return jsonify([{
            'id': reminder.id,
            'vehicle_id': reminder.vehicle_id,
            'title': reminder.title,
            'description': reminder.description,
            'due_date': reminder.due_date.isoformat()
        } for reminder in reminders])
    except Exception as e:
        logging.error(f"Error in get_reminders: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Route pour le tableau de bord
@api_bp.route('/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    try:
        total_vehicles = Vehicle.query.count()
        available_vehicles = Vehicle.query.filter_by(status='available').count()
        active_rentals = Rental.query.filter_by(status='active').count()
        pending_maintenances = Maintenance.query.filter(
            Maintenance.date > datetime.utcnow()
        ).count()
        
        return jsonify({
            'total_vehicles': total_vehicles,
            'available_vehicles': available_vehicles,
            'active_rentals': active_rentals,
            'pending_maintenances': pending_maintenances
        })
    except Exception as e:
        logging.error(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour les notes
@api_bp.route('/vehicles/<int:vehicle_id>/notes', methods=['GET'])
@login_required
def get_vehicle_notes(vehicle_id):
    notes = Note.query.filter_by(vehicle_id=vehicle_id).all()
    return jsonify([note.to_dict() for note in notes])

@api_bp.route('/vehicles/<int:vehicle_id>/notes', methods=['POST'])
@login_required
def add_vehicle_note(vehicle_id):
    try:
        data = request.get_json()
        
        if 'content' not in data:
            return jsonify({'error': 'Le contenu de la note est requis'}), 400
            
        new_note = Note(
            vehicle_id=vehicle_id,
            content=data['content'],
            user_id=request.current_user.id
        )
        
        db.session.add(new_note)
        db.session.commit()
        
        # Log the action
        log_action(
            user_id=request.current_user.id,
            action_type='create',
            entity_type='note',
            entity_id=new_note.id,
            changes={'content': new_note.content}
        )
        
        return jsonify({
            'message': 'Note ajoutée avec succès',
            'note': new_note.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in add_vehicle_note: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_vehicle_note(vehicle_id, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        data = request.get_json()
        
        if note.vehicle_id != vehicle_id:
            return jsonify({'error': 'Note non trouvée pour ce véhicule'}), 404
            
        if 'content' not in data:
            return jsonify({'error': 'Le contenu de la note est requis'}), 400
            
        old_content = note.content
        note.content = data['content']
        db.session.commit()
        
        # Log the action
        log_action(
            user_id=request.current_user.id,
            action_type='update',
            entity_type='note',
            entity_id=note.id,
            changes={'content': {'old': old_content, 'new': note.content}}
        )
        
        return jsonify({
            'message': 'Note mise à jour avec succès',
            'note': note.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in update_vehicle_note: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/vehicles/<int:vehicle_id>/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_vehicle_note(vehicle_id, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        if note.vehicle_id != vehicle_id:
            return jsonify({'error': 'Note non trouvée pour ce véhicule'}), 404
            
        note_content = note.content
        db.session.delete(note)
        db.session.commit()
        
        # Log the action
        log_action(
            user_id=request.current_user.id,
            action_type='delete',
            entity_type='note',
            entity_id=note_id,
            changes={'content': note_content}
        )
        
        return jsonify({'message': 'Note supprimée avec succès'})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error in delete_vehicle_note: {str(e)}")
        return jsonify({'error': str(e)}), 500
