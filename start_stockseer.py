#!/usr/bin/env python3
"""
Main startup script for StockSeer.AI
This script can start both the backend and frontend servers
"""

import subprocess
import sys
import os
import time
import threading
import signal
from pathlib import Path

class StockSeerLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.root_dir = Path(__file__).parent
        self.backend_dir = self.root_dir / "backend"
        self.frontend_dir = self.root_dir / "stockseer-frontend"
        
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        print("🔍 Checking dependencies...")
        
        # Check Python
        try:
            result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
            print(f"✅ Python: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ Python check failed: {e}")
            return False
            
        # Check Node.js for frontend
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            print(f"✅ Node.js: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ Node.js not found: {e}")
            print("   Please install Node.js to run the frontend")
            
        return True
    
    def start_backend(self):
        """Start the FastAPI backend server"""
        print("🚀 Starting Backend Server...")
        try:
            self.backend_process = subprocess.Popen(
                [sys.executable, "start_backend.py"],
                cwd=self.backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Give backend time to start
            time.sleep(3)
            
            if self.backend_process.poll() is None:
                print("✅ Backend server started successfully")
                print("   🌐 Backend API: http://localhost:8000")
                print("   📚 API Docs: http://localhost:8000/docs")
                return True
            else:
                print("❌ Backend server failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Error starting backend: {e}")
            return False
    
    def start_frontend(self):
        """Start the React frontend server"""
        print("🎨 Starting Frontend Server...")
        try:
            # Check if node_modules exists
            if not (self.frontend_dir / "node_modules").exists():
                print("📦 Installing frontend dependencies...")
                subprocess.run(["npm", "install"], cwd=self.frontend_dir, check=True)
            
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=self.frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Give frontend time to start
            time.sleep(5)
            
            if self.frontend_process.poll() is None:
                print("✅ Frontend server started successfully")
                print("   🌐 Frontend: http://localhost:3000")
                return True
            else:
                print("❌ Frontend server failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Error starting frontend: {e}")
            return False
    
    def monitor_processes(self):
        """Monitor running processes"""
        try:
            while True:
                if self.backend_process and self.backend_process.poll() is not None:
                    print("❌ Backend process stopped unexpectedly")
                    break
                    
                if self.frontend_process and self.frontend_process.poll() is not None:
                    print("❌ Frontend process stopped unexpectedly")
                    break
                    
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down servers...")
            self.stop_all()
    
    def stop_all(self):
        """Stop all running processes"""
        if self.backend_process:
            self.backend_process.terminate()
            print("🛑 Backend server stopped")
            
        if self.frontend_process:
            self.frontend_process.terminate()
            print("🛑 Frontend server stopped")
    
    def run(self, start_backend=True, start_frontend=True):
        """Main run method"""
        print("=" * 60)
        print("🎯 StockSeer.AI - AI-Powered Stock Analysis Platform")
        print("=" * 60)
        
        if not self.check_dependencies():
            return
        
        # Set up signal handler for graceful shutdown
        signal.signal(signal.SIGINT, lambda s, f: self.stop_all())
        signal.signal(signal.SIGTERM, lambda s, f: self.stop_all())
        
        try:
            if start_backend:
                if not self.start_backend():
                    print("❌ Failed to start backend. Exiting...")
                    return
            
            if start_frontend:
                if not self.start_frontend():
                    print("❌ Failed to start frontend. Exiting...")
                    return
            
            print("\n" + "=" * 60)
            print("🎉 StockSeer.AI is now running!")
            print("=" * 60)
            print("🌐 Frontend: http://localhost:3000")
            print("🔧 Backend API: http://localhost:8000")
            print("📚 API Documentation: http://localhost:8000/docs")
            print("\n💡 Press Ctrl+C to stop all servers")
            print("=" * 60)
            
            # Monitor processes
            self.monitor_processes()
            
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            self.stop_all()

def main():
    """Main entry point"""
    launcher = StockSeerLauncher()
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--backend-only":
            launcher.run(start_backend=True, start_frontend=False)
        elif sys.argv[1] == "--frontend-only":
            launcher.run(start_backend=False, start_frontend=True)
        else:
            print("Usage: python start_stockseer.py [--backend-only|--frontend-only]")
    else:
        launcher.run()

if __name__ == "__main__":
    main()
