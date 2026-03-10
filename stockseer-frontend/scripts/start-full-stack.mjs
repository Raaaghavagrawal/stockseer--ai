#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting StockSeer Full-Stack Application...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check if Python is available
function checkPython() {
  return new Promise((resolve) => {
    const pythonCheck = spawn('python', ['--version']);
    pythonCheck.on('close', (code) => {
      if (code === 0) {
        resolve('python');
      } else {
        // Try python3
        const python3Check = spawn('python3', ['--version']);
        python3Check.on('close', (code3) => {
          if (code3 === 0) {
            resolve('python3');
          } else {
            resolve(null);
          }
        });
      }
    });
  });
}

// Check if required Python packages are installed
async function checkPythonDependencies() {
  const pythonCmd = await checkPython();
  if (!pythonCmd) {
    logError('Python is not installed or not in PATH');
    process.exit(1);
  }

  logInfo('Checking Python dependencies...');
  
  const requiredPackages = [
    'fastapi', 'uvicorn', 'pydantic', 'yfinance', 'pandas', 'numpy', 'ta'
  ];

  for (const pkg of requiredPackages) {
    try {
      const result = await new Promise((resolve) => {
        const check = spawn(pythonCmd, ['-c', `import ${pkg}`]);
        check.on('close', (code) => resolve(code === 0));
      });
      
      if (!result) {
        logWarning(`Package ${pkg} not found. Installing...`);
        await installPackage(pythonCmd, pkg);
      }
    } catch (error) {
      logWarning(`Could not check ${pkg}: ${error.message}`);
    }
  }
  
  logSuccess('Python dependencies are ready');
}

// Install Python package
function installPackage(pythonCmd, packageName) {
  return new Promise((resolve, reject) => {
    logInfo(`Installing ${packageName}...`);
    const install = spawn(pythonCmd, ['-m', 'pip', 'install', packageName]);
    
    install.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    install.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${packageName} installed successfully`);
        resolve();
      } else {
        logError(`Failed to install ${packageName}`);
        reject(new Error(`Installation failed with code ${code}`));
      }
    });
  });
}

// Start FastAPI backend
function startBackend(pythonCmd) {
  return new Promise((resolve, reject) => {
    logInfo('Starting FastAPI backend...');
    
    const backend = spawn(pythonCmd, ['backend_api.py'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    let backendReady = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[Backend] ${output}`);
      
      if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
        backendReady = true;
        logSuccess('FastAPI backend is running on http://localhost:8000');
        logInfo('API documentation available at: http://localhost:8000/docs');
        resolve(backend);
      }
    });
    
    backend.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('INFO:') && !output.includes('WARNING:')) {
        process.stderr.write(`[Backend Error] ${output}`);
      }
    });
    
    backend.on('error', (error) => {
      logError(`Backend error: ${error.message}`);
      reject(error);
    });
    
    backend.on('close', (code) => {
      if (!backendReady) {
        logError(`Backend process exited with code ${code}`);
        reject(new Error(`Backend exited with code ${code}`));
      }
    });
    
    // Timeout for backend startup
    setTimeout(() => {
      if (!backendReady) {
        logWarning('Backend startup taking longer than expected...');
      }
    }, 5000);
  });
}

// Start Streamlit
function startStreamlit(pythonCmd) {
  return new Promise((resolve, reject) => {
    logInfo('Starting Streamlit...');
    
    const streamlit = spawn(pythonCmd, ['-m', 'streamlit', 'run', '../app.py', '--server.port', '8501', '--server.headless', 'true'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    let streamlitReady = false;
    
    streamlit.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[Streamlit] ${output}`);
      
      if (output.includes('You can now view your Streamlit app in your browser') || 
          output.includes('Local URL: http://localhost:8501')) {
        streamlitReady = true;
        logSuccess('Streamlit is running on http://localhost:8501');
        resolve(streamlit);
      }
    });
    
    streamlit.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('INFO:') && !output.includes('WARNING:')) {
        process.stderr.write(`[Streamlit Error] ${output}`);
      }
    });
    
    streamlit.on('error', (error) => {
      logError(`Streamlit error: ${error.message}`);
      reject(error);
    });
    
    streamlit.on('close', (code) => {
      if (!streamlitReady) {
        logError(`Streamlit process exited with code ${code}`);
        reject(new Error(`Streamlit exited with code ${code}`));
      }
    });
    
    // Timeout for Streamlit startup
    setTimeout(() => {
      if (!streamlitReady) {
        logWarning('Streamlit startup taking longer than expected...');
      }
    }, 10000);
  });
}

// Start Vite frontend
function startFrontend() {
  return new Promise((resolve, reject) => {
    logInfo('Starting Vite frontend development server...');
    
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true
    });
    
    let frontendReady = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[Frontend] ${output}`);
      
      if (output.includes('Local:') && output.includes('http://localhost:3000')) {
        frontendReady = true;
        logSuccess('Frontend is running on http://localhost:3000');
        logInfo('Opening browser...');
        resolve(frontend);
      }
    });
    
    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('WARN') && !output.includes('DeprecationWarning')) {
        process.stderr.write(`[Frontend Error] ${output}`);
      }
    });
    
    frontend.on('error', (error) => {
      logError(`Frontend error: ${error.message}`);
      reject(error);
    });
    
    frontend.on('close', (code) => {
      if (!frontendReady) {
        logError(`Frontend process exited with code ${code}`);
        reject(new Error(`Frontend exited with code ${code}`));
      }
    });
  });
}

// Open browser
function openBrowser() {
  const url = 'http://localhost:3000';
  
  let command;
  switch (process.platform) {
    case 'darwin':
      command = 'open';
      break;
    case 'win32':
      command = 'start';
      break;
    default:
      command = 'xdg-open';
      break;
  }
  
  try {
    spawn(command, [url], { stdio: 'ignore' });
    logSuccess(`Browser opened to ${url}`);
  } catch (error) {
    logWarning(`Could not open browser automatically. Please visit ${url}`);
  }
}

// Main function
async function main() {
  try {
    // Check Python dependencies
    await checkPythonDependencies();
    
    const pythonCmd = await checkPython();
    
    // Start backend and Streamlit in parallel
    logInfo('Starting backend services...');
    const [backend, streamlit] = await Promise.all([
      startBackend(pythonCmd),
      startStreamlit(pythonCmd)
    ]);
    
    // Wait a bit for services to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start frontend
    const frontend = await startFrontend();
    
    // Open browser
    setTimeout(openBrowser, 1000);
    
    logSuccess('\n🎉 StockSeer is now running!');
    logInfo('\nServices:');
    logInfo('  • Frontend: http://localhost:3000');
    logInfo('  • FastAPI Backend: http://localhost:8000');
    logInfo('  • Streamlit: http://localhost:8501');
    logInfo('  • API Docs: http://localhost:8000/docs');
    
    logInfo('\nPress Ctrl+C to stop all services');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      logWarning('\n🛑 Shutting down services...');
      
      try {
        backend.kill('SIGTERM');
        streamlit.kill('SIGTERM');
        frontend.kill('SIGTERM');
        
        // Wait for processes to terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force kill if still running
        if (!backend.killed) backend.kill('SIGKILL');
        if (!streamlit.killed) streamlit.kill('SIGKILL');
        if (!frontend.killed) frontend.kill('SIGKILL');
        
        logSuccess('All services stopped');
        process.exit(0);
      } catch (error) {
        logError(`Error during shutdown: ${error.message}`);
        process.exit(1);
      }
    });
    
    // Keep the script running
    process.stdin.resume();
    
  } catch (error) {
    logError(`Failed to start services: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
