# SmartFarm

A full-stack web application with a React frontend and Node.js backend.

## Project Structure

    SmartFarm/
    ├── backend/
    └── frontend/

- **backend** - Node.js backend API
- **frontend** - Vite + React + TypeScript frontend

## Requirements

- Node.js
- npm

## Installation

### Backend

    cd backend
    npm install

### Frontend

    cd frontend
    npm install

## Running the Project

Run the backend and frontend in separate terminals.

### Backend

    cd backend
    npm run dev

### Frontend

    cd frontend
    npm run dev

## Database Setup

This project uses MySQL through XAMPP.

1. Install and open XAMPP.
2. Start the MySQL service.
3. Open phpMyAdmin.
4. Create a database named `smartfarm`.
5. Import `database/smartfarm.sql` into the `smartfarm` database.
6. Create a `.env` file in the `backend` directory based on `.env.example`.
7. Update the database credentials if necessary.

Example:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smartfarm
DB_PORT=3306
