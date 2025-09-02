#!/usr/bin/env python3
"""
StockSeer Launcher Script
This script can be run from anywhere to start the full-stack StockSeer application
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def main():
    print("🚀 StockSeer Launcher")
    print("=" * 40)
    
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the stockseer-frontend directory
    os.chdir(script_dir)
    
    print(f"📁 Working directory: {script_dir}")
    
    # Check if we're in the right directory
    if not (script_dir / "package.json").exists():
        print("❌ Error: package.json not found. Please run this script from the stockseer-frontend directory.")
        return
    
    # Check if Node.js is available
    try:
        subprocess.run(["node", "--version"], check=True, capture_output=True)
        print("✅ Node.js is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: Node.js is not installed or not in PATH")
        print("Please install Node.js from https://nodejs.org/")
        return
    
    # Check if npm is available
    try:
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
        print("✅ npm is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: npm is not installed or not in PATH")
        return
    
    # Check if Python is available
    python_cmd = None
    for cmd in ["python", "python3"]:
        try:
            subprocess.run([cmd, "--version"], check=True, capture_output=True)
            python_cmd = cmd
            print(f"✅ Python is available ({cmd})")
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    if not python_cmd:
        print("❌ Error: Python is not installed or not in PATH")
        print("Please install Python from https://python.org/")
        return
    
    # Install dependencies if needed
    print("\n📦 Checking dependencies...")
    
    # Install frontend dependencies
    if not (script_dir / "node_modules").exists():
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)
        print("✅ Frontend dependencies installed")
    else:
        print("✅ Frontend dependencies already installed")
    
    # Install backend dependencies
    requirements_file = script_dir / "backend_requirements.txt"
    if requirements_file.exists():
        print("Installing backend dependencies...")
        subprocess.run([python_cmd, "-m", "pip", "install", "-r", "backend_requirements.txt"], check=True)
        print("✅ Backend dependencies installed")
    else:
        print("⚠️  Backend requirements file not found")
    
    print("\n🚀 Starting StockSeer...")
    print("This will start:")
    print("  • FastAPI Backend (Port 8000)")
    print("  • Streamlit App (Port 8501)")
    print("  • React Frontend (Port 3000)")
    print("\nPress Ctrl+C to stop all services")
    
    try:
        # Start the full-stack application
        subprocess.run(["npm", "run", "dev:full"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Stopping StockSeer...")
        print("✅ All services stopped")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error starting StockSeer: {e}")
        print("\nTrying alternative startup method...")
        
        # Alternative: start services individually
        try:
            print("\nStarting services individually...")
            
            # Start backend
            backend_process = subprocess.Popen([python_cmd, "backend_api.py"])
            print("✅ Backend started")
            
            # Wait a bit
            time.sleep(3)
            
            # Start Streamlit
            streamlit_process = subprocess.Popen([python_cmd, "-m", "streamlit", "run", "../app.py", "--server.port", "8501", "--server.headless", "true"])
            print("✅ Streamlit started")
            
            # Wait a bit
            time.sleep(3)
            
            # Start frontend
            frontend_process = subprocess.Popen(["npm", "run", "dev"])
            print("✅ Frontend started")
            
            # Open browser
            time.sleep(5)
            webbrowser.open("http://localhost:3000")
            
            print("\n🎉 StockSeer is now running!")
            print("Services:")
            print("  • Frontend: http://localhost:3000")
            print("  • Backend: http://localhost:8000")
            print("  • Streamlit: http://localhost:8501")
            
            # Wait for user to stop
            try:
                backend_process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping services...")
                backend_process.terminate()
                streamlit_process.terminate()
                frontend_process.terminate()
                print("✅ All services stopped")
                
        except Exception as e:
            print(f"❌ Alternative startup failed: {e}")
            print("\nPlease try starting services manually:")
            print("1. Terminal 1: python backend_api.py")
            print("2. Terminal 2: streamlit run ../app.py --server.port 8501")
            print("3. Terminal 3: npm run dev")

if __name__ == "__main__":
    main()
