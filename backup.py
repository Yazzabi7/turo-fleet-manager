import os
import shutil
import sqlite3
from datetime import datetime
import json
import logging

def create_backup():
    # Configuration du logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # Créer le dossier de backup avec la date actuelle
        backup_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'backups',
            datetime.now().strftime('%Y%m%d_%H%M%S')
        )
        os.makedirs(backup_dir, exist_ok=True)
        logger.info(f"Dossier de backup créé : {backup_dir}")

        # Backup de la base de données
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.db')
        if os.path.exists(db_path):
            backup_db_path = os.path.join(backup_dir, 'app.db')
            # Copier la base de données
            shutil.copy2(db_path, backup_db_path)
            logger.info("Base de données sauvegardée")

            # Exporter les données en JSON pour une meilleure lisibilité
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Liste des tables à sauvegarder
                tables = [
                    'user', 'vehicle', 'maintenance', 'rental',
                    'reminder', 'note', 'action_history'
                ]
                
                data_export = {}
                for table in tables:
                    try:
                        cursor.execute(f"SELECT * FROM {table}")
                        columns = [description[0] for description in cursor.description]
                        rows = cursor.fetchall()
                        
                        table_data = []
                        for row in rows:
                            table_data.append(dict(zip(columns, row)))
                        
                        data_export[table] = table_data
                    except sqlite3.OperationalError as e:
                        logger.warning(f"Impossible d'exporter la table {table}: {str(e)}")
                
                # Sauvegarder les données en JSON
                with open(os.path.join(backup_dir, 'data_export.json'), 'w', encoding='utf-8') as f:
                    json.dump(data_export, f, ensure_ascii=False, indent=2)
                logger.info("Données exportées en JSON")
                
                conn.close()
            except Exception as e:
                logger.error(f"Erreur lors de l'export JSON: {str(e)}")

        # Backup des fichiers du projet
        dirs_to_backup = [
            'app',
            'frontend-new',
            'migrations'
        ]
        
        files_to_backup = [
            'config.py',
            'requirements.txt',
            'README.md',
            'backup.py'
        ]

        # Liste des fichiers spécifiques au mode hors ligne
        offline_files = [
            'frontend-new/public/service-worker.js',
            'frontend-new/src/services/offlineSync.ts',
            'frontend-new/src/components/OnlineStatus.tsx',
            'frontend-new/src/serviceWorkerRegistration.ts'
        ]

        # Copier les dossiers
        for dir_name in dirs_to_backup:
            src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), dir_name)
            if os.path.exists(src_dir):
                dst_dir = os.path.join(backup_dir, dir_name)
                shutil.copytree(src_dir, dst_dir)
                logger.info(f"Dossier {dir_name} sauvegardé")

        # Copier les fichiers individuels
        for file_name in files_to_backup:
            src_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), file_name)
            if os.path.exists(src_file):
                shutil.copy2(src_file, backup_dir)
                logger.info(f"Fichier {file_name} sauvegardé")

        # S'assurer que les fichiers du mode hors ligne sont sauvegardés
        for offline_file in offline_files:
            src_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), offline_file)
            if os.path.exists(src_file):
                # Créer le dossier de destination si nécessaire
                dst_file = os.path.join(backup_dir, offline_file)
                os.makedirs(os.path.dirname(dst_file), exist_ok=True)
                shutil.copy2(src_file, dst_file)
                logger.info(f"Fichier {offline_file} sauvegardé")

        # Sauvegarder le package.json pour les dépendances du frontend
        package_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend-new/package.json')
        if os.path.exists(package_json_path):
            dst_package_json = os.path.join(backup_dir, 'frontend-new/package.json')
            shutil.copy2(package_json_path, dst_package_json)
            logger.info("Package.json sauvegardé")

        logger.info("Backup terminé avec succès!")
        return backup_dir
    except Exception as e:
        logger.error(f"Erreur lors du backup: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        backup_path = create_backup()
        print(f"\nBackup créé avec succès dans: {backup_path}")
        print("\nContenu du backup :")
        print("- Base de données (app.db)")
        print("- Export des données (data_export.json)")
        print("- Fichiers du backend (dossier app)")
        print("- Fichiers du frontend (dossier frontend-new)")
        print("- Fichiers de configuration")
        print("- Fichiers du mode hors ligne")
    except Exception as e:
        print(f"\nErreur lors du backup: {str(e)}")
