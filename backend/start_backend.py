#!/usr/bin/env python3
"""
Backend startup script for StockSeer.AI
This script starts the FastAPI backend server
"""

import uvicorn
import os
import sys

def main():
    """Start the FastAPI backend server"""
    try:
        # Change to the backend directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(backend_dir)
        
        print("🚀 Starting StockSeer.AI Backend Server...")
        print("📍 Backend directory:", backend_dir)
        print("🌐 Server will be available at: http://localhost:8000")
        print("📚 API documentation at: http://localhost:8000/docs")
        print("🔄 Press Ctrl+C to stop the server")
        print("-" * 50)
        
        # Start the FastAPI server
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[backend_dir],
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
