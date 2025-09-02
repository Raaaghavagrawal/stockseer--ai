#!/usr/bin/env python3
"""
Development startup script for StockSeer
This script starts the FastAPI backend and provides instructions for the frontend
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'pydantic', 'yfinance', 'pandas', 'numpy', 'ta'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them using:")
        print(f"pip install -r backend_requirements.txt")
        return False
    
    print("✅ All required packages are installed")
    return True

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting StockSeer FastAPI backend...")
    
    # Get the directory of this script
    script_dir = Path(__file__).parent
    backend_file = script_dir / "backend_api.py"
    
    if not backend_file.exists():
        print(f"❌ Backend file not found: {backend_file}")
        return None
    
    try:
        # Start the backend server
        process = subprocess.Popen([
            sys.executable, str(backend_file)
        ], cwd=script_dir)
        
        # Wait a moment for the server to start
        time.sleep(3)
        
        # Check if the process is still running
        if process.poll() is None:
            print("✅ Backend server started successfully on http://localhost:8000")
            print("📊 API documentation available at: http://localhost:8000/docs")
            return process
        else:
            print("❌ Backend server failed to start")
            return None
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def start_frontend():
    """Provide instructions for starting the frontend"""
    print("\n🌐 Frontend Setup Instructions:")
    print("1. Open a new terminal window")
    print("2. Navigate to the stockseer-frontend directory:")
    print("   cd stockseer-frontend")
    print("3. Install frontend dependencies:")
    print("   npm install")
    print("4. Start the frontend development server:")
    print("   npm run dev")
    print("5. The frontend will be available at: http://localhost:3000")
    
    # Try to open the frontend in browser after a delay
    def open_frontend():
        time.sleep(2)
        try:
            webbrowser.open("http://localhost:3000")
        except:
            pass
    
    import threading
    threading.Timer(5, open_frontend).start()

def main():
    """Main function to start the development environment"""
    print("🎯 StockSeer Development Environment Setup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Please install missing dependencies and try again")
        return
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("\n❌ Failed to start backend. Please check the error messages above.")
        return
    
    # Provide frontend instructions
    start_frontend()
    
    print("\n🔄 Development environment is running!")
    print("Press Ctrl+C to stop the backend server")
    
    try:
        # Keep the script running
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping backend server...")
        backend_process.terminate()
        backend_process.wait()
        print("✅ Backend server stopped")

if __name__ == "__main__":
    main()
