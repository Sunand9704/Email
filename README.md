# Email Collection App

This project consists of a Node.js/Express backend and a React/Vite frontend.

## Prerequisites
- Node.js installed
- MongoDB installed and running locally (or update `backend/.env` with your URI)

## Setup and Run

### Backend
1. Open a terminal.
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`.

### Frontend
1. Open a new terminal.
2. Navigate to the frontend folder:
   ```bash
   cd frontned
   ```
   *(Note: folder name is `frontned`)*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Access the app at the URL provided (usually `http://localhost:5173`).

## Features
- Add emails (No limit)
- Prevent duplicates
- View list of added emails
