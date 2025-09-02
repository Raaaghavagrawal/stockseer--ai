#!/bin/bash

echo
echo "========================================"
echo "   StockSeer Full-Stack Application"
echo "========================================"
echo
echo "Starting all services..."
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    echo "Please install npm (comes with Node.js)"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    print_error "Python is not installed or not in PATH"
    echo "Please install Python from https://python.org/"
    exit 1
fi

print_success "Dependencies check passed!"
echo
print_status "Starting StockSeer..."
echo

# Make the script executable
chmod +x start-stockseer.sh

# Start the full-stack application
npm run dev:full
