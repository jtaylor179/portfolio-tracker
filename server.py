from flask import Flask, send_from_directory
from flask_cors import CORS
import os


app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes


@app.route('/<path:path>')
def serve_file_in_dir(path):
    if not os.path.isfile('public/' + path):
        path = os.path.join(path, 'index.html')
    return send_from_directory('public', path)

if __name__ == "__main__":
    app.run(debug=True)
