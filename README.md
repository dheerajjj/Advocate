# Aparajitha Advocate Portal

A full-stack web application for Indian advocate/law firm management built with React + FastAPI.

## Features

- **JWT Authentication** — Secure login with protected routes
- **Dashboard** — Stats overview with total/active cases, upcoming hearings, pending tasks
- **Client Management** — Add, edit, delete, search clients
- **Case Management** — Full CRUD with case types, CNR numbers, court details, status tracking
- **Hearing Management** — Schedule hearings, mark completed, track by case
- **Document Management** — Upload PDF/DOC/images, link to cases/clients, download
- **Task Management** — Create tasks with priority & due dates, assign to cases/clients
- **Court Status** — CNR lookup placeholder for future eCourts API integration

## Tech Stack

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** FastAPI + SQLAlchemy + Pydantic
- **Database:** SQLite (app.db)
- **Auth:** JWT (python-jose + passlib/bcrypt)

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: **http://127.0.0.1:8000**
API docs at: **http://127.0.0.1:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Login Credentials

- **Username:** admin
- **Password:** admin123

## Project Structure

```
advocate/
  backend/
    main.py              # FastAPI app entry point
    database.py          # SQLAlchemy engine & session
    models.py            # Database models
    schemas.py           # Pydantic schemas
    auth.py              # JWT authentication
    routers/
      clients.py         # Client CRUD endpoints
      cases.py           # Case CRUD endpoints
      hearings.py        # Hearing CRUD endpoints
      documents.py       # Document upload/download
      tasks.py           # Task CRUD endpoints
    uploads/             # Uploaded files storage
    requirements.txt
  frontend/
    src/
      components/        # Sidebar, Header, StatCard, DataTable, ProtectedRoute
      pages/             # Login, Dashboard, Clients, Cases, Hearings, Documents, Tasks, CourtStatus
      services/api.js    # Axios instance with JWT interceptor
      App.jsx            # Router configuration
      main.jsx           # React entry point
      styles.css         # Complete CSS theme
    package.json
    vite.config.js
  README.md
```
