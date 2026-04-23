"""
Prospector API — Entry Point

This file creates the Flask app using the modular factory pattern.
The original monolith is preserved as app.py.bak.
"""
from app.app_factory import app

# WSGI application
application = app

if __name__ == "__main__":
    from app.config.settings import HOST, PORT, DEBUG
    app.run(host=HOST, port=PORT, debug=DEBUG)