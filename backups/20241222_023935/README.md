# Turo Fleet Manager

Application web de gestion de flotte de véhicules pour Turo.

## Fonctionnalités

- Gestion des véhicules (ajout, modification, suppression)
- Suivi en temps réel de la disponibilité
- Gestion des emplacements de parking
- Suivi des entretiens et nettoyages
- Tableau de bord avec KPIs
- Système de rappels automatiques
- Interface responsive et mobile-friendly

## Technologies utilisées

- Backend: Python/Flask
- Frontend: React
- Base de données: PostgreSQL
- API Maps: Google Maps API
- Authentification: JWT

## Installation

1. Cloner le repository
2. Installer les dépendances backend:
```bash
pip install -r requirements.txt
```
3. Installer les dépendances frontend:
```bash
cd frontend
npm install
```

## Configuration

1. Créer un fichier `.env` à la racine du projet
2. Configurer les variables d'environnement nécessaires:
```
DATABASE_URL=postgresql://user:password@localhost/turo_fleet
GOOGLE_MAPS_API_KEY=your_api_key
SECRET_KEY=your_secret_key
```

## Démarrage

1. Démarrer le backend:
```bash
flask run
```

2. Démarrer le frontend:
```bash
cd frontend
npm start
```
