# Žilina City Guide

A full-stack city guide web application for discovering places in Žilina, with user authentication, filtering, comments, role-based access and an admin interface.

**Live demo:** https://zilina-city-guide.onrender.com/

## Features

- User registration and login
- Session-based authentication
- Role-based access for users and administrators
- Place browsing and filtering
- Comments and user interaction
- Admin management functionality
- MySQL database integration
- File attachment support
- Persistent MySQL-backed sessions
- Responsive server-rendered interface

## Tech Stack

**Backend:** Node.js · Express  
**Frontend:** EJS · JavaScript · CSS  
**Database:** MySQL  
**Authentication:** express-session · bcrypt  
**Other:** multer · express-mysql-session

## Project Structure

```text
├── app.js
├── data/
├── public/
│   ├── images/
│   ├── scripts/
│   └── styles/
├── routes/
│   ├── attachments.js
│   ├── auth.js
│   ├── comments.js
│   ├── defaults.js
│   └── users.js
├── scripts/
├── tests/
├── util/
└── views/
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/quttaj/zilina-city-guide.git
cd zilina-city-guide
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and configure your MySQL connection:

```env
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=new_schema
DB_USER=root
DB_PASSWORD=
DB_SSL=false

SESSION_SECRET=
```

Use a secure random value for `SESSION_SECRET`.

### 4. Initialize the database

```bash
npm run db:setup
```

This creates the required database tables and inserts the demo places.

### 5. Start the application

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

## Testing

Run the test suite with:

```bash
npm test
```

## Deployment

The project is configured for deployment on Render and supports an external MySQL database.

## About

This project was built as a full-stack web application focused on backend architecture, database integration, authentication, user roles and server-rendered interfaces.
