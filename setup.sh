#!/bin/bash

# Flight Reservation System - Quick Setup Script
# This script automates the setup process

echo "=========================================="
echo "Flight Reservation System - Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm $(npm --version) installed${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check MySQL
echo -e "${YELLOW}Checking MySQL...${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL installed${NC}"
else
    echo -e "${RED}✗ MySQL not found. Please install MySQL 8.0+${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 1: Database Setup"
echo "=========================================="
echo ""
echo "Please run the following in MySQL Workbench:"
echo "  1. Open db/schema-with-data.sql"
echo "  2. Execute the script"
echo ""
read -p "Press Enter once database is setup..."

echo ""
echo "=========================================="
echo "Step 2: Backend Setup"
echo "=========================================="
echo ""

cd backend

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your MySQL password${NC}"
    read -p "Press Enter once .env is configured..."
fi

echo -e "${YELLOW}Installing backend dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 3: Frontend Setup"
echo "=========================================="
echo ""

cd ../frontend

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "Then open: http://localhost:5174"
echo ""
echo "Login with:"
echo "  Email: john.doe@email.com"
echo "  Password: password123"
echo ""
echo "=========================================="
