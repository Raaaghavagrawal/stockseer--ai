#!/bin/bash

echo "Starting StockSeer.AI Backend Server..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if requirements are installed
echo "Checking dependencies..."
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Start the backend server
echo "Starting server..."
python3 start_backend.py
