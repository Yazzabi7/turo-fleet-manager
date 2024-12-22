from app import create_app
import os

# Configuration du logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
)

app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.logger.info('Starting Flask server...')
    try:
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        app.logger.error(f'Error starting server: {str(e)}')
