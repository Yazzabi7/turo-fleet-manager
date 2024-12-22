from app import app, db
from app.models import Vehicle, Maintenance, Cleaning, Rental, Note
from datetime import datetime, timedelta

def init_db():
    with app.app_context():
        # Supprime toutes les tables existantes
        db.drop_all()
        
        # Crée toutes les tables
        db.create_all()

        # Création des véhicules
        vehicles = [
            Vehicle(
                brand='Tesla',
                model='Model 3',
                year=2023,
                license_plate='ABC123',
                status='available',
                parking_spot='A1',
                daily_rate=89.99
            ),
            Vehicle(
                brand='BMW',
                model='X5',
                year=2022,
                license_plate='XYZ789',
                status='rented',
                parking_spot='B2',
                daily_rate=129.99
            ),
            Vehicle(
                brand='Mercedes',
                model='C300',
                year=2023,
                license_plate='DEF456',
                status='maintenance',
                parking_spot='C3',
                daily_rate=99.99
            ),
            Vehicle(
                brand='Porsche',
                model='911',
                year=2022,
                license_plate='GHI789',
                status='needs_repair',
                parking_spot='D4',
                daily_rate=199.99
            ),
            Vehicle(
                brand='Audi',
                model='Q7',
                year=2023,
                license_plate='JKL012',
                status='needs_cleaning',
                parking_spot='E5',
                daily_rate=149.99
            )
        ]

        # Ajout des véhicules
        for vehicle in vehicles:
            db.session.add(vehicle)
        db.session.commit()

        # Création des maintenances
        maintenances = [
            Maintenance(
                vehicle_id=vehicles[2].id,
                type='Révision',
                description='Révision des 30 000 km',
                date=datetime.utcnow() + timedelta(days=7),
                status='scheduled'
            ),
            Maintenance(
                vehicle_id=vehicles[3].id,
                type='Réparation',
                description='Changement des plaquettes de frein',
                date=datetime.utcnow() + timedelta(days=2),
                status='pending'
            )
        ]
        for maintenance in maintenances:
            db.session.add(maintenance)

        # Création des locations
        rentals = [
            Rental(
                vehicle_id=vehicles[1].id,
                start_date=datetime.utcnow() - timedelta(days=2),
                end_date=datetime.utcnow() + timedelta(days=3),
                turo_booking_id='TURO123456',
                status='active'
            ),
            Rental(
                vehicle_id=vehicles[0].id,
                start_date=datetime.utcnow() + timedelta(days=5),
                end_date=datetime.utcnow() + timedelta(days=8),
                turo_booking_id='TURO789012',
                status='upcoming'
            )
        ]
        for rental in rentals:
            db.session.add(rental)

        # Création des nettoyages
        cleanings = [
            Cleaning(
                vehicle_id=vehicles[4].id,
                type='deep',
                date=datetime.utcnow() + timedelta(days=1),
                status='scheduled'
            ),
            Cleaning(
                vehicle_id=vehicles[0].id,
                type='basic',
                date=datetime.utcnow() + timedelta(days=4),
                status='scheduled'
            )
        ]
        for cleaning in cleanings:
            db.session.add(cleaning)

        # Création des notes
        notes = [
            Note(
                vehicle_id=vehicles[0].id,
                content='Excellent état général, très populaire sur Turo'
            ),
            Note(
                vehicle_id=vehicles[1].id,
                content='Client régulier - M. Martin - préfère cette voiture'
            ),
            Note(
                vehicle_id=vehicles[2].id,
                content='Prévoir changement des plaquettes de frein au prochain entretien'
            ),
            Note(
                vehicle_id=vehicles[3].id,
                content='Problème de suspension à vérifier'
            ),
            Note(
                vehicle_id=vehicles[4].id,
                content='Nettoyage complet nécessaire après dernière location'
            )
        ]
        for note in notes:
            db.session.add(note)

        # Commit final
        db.session.commit()
        print("Base de données initialisée avec succès !")

if __name__ == '__main__':
    init_db()
