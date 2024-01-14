#!/bin/bash

# Navigate to the script's directory
# cd "$(dirname "$0")"

# Create a virtual environment
python3 -m venv env

# Activate the virtual environment
source env/bin/activate

# Install Flask
pip install flask

# Run the server.py file
python server.py