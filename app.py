from flask import Flask, send_from_directory, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='public')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/src/<path:path>')
def serve_js(path):
    return send_from_directory('src', path)

@app.route('/Cesium/<path:path>')
def serve_cesium(path):
    return send_from_directory('node_modules/cesium/Build/Cesium', path)

@app.route('/api/data')
def get_data():
    api_token = os.getenv('API_TOKEN')
    return jsonify({"message": "Token lido com sucesso!", "token": api_token})

if __name__ == '__main__':
    app.run(port=8080)