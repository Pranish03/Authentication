# Full Stack Authentication System (MERN)

This is a simple full-stack authentication system built using **MongoDB, Express, React, and Node.js**.  
It supports features like signup, login, email verification, forgot password, password reset, and JWT-based authentication using cookies.

The UI is built with **React + Vite + Tailwind CSS + Framer Motion**, and the backend uses **Express + MongoDB + Mailtrap for emails**.


## Features

- User Signup & Login
- Email Verification (OTP / Code based)
- JWT Authentication using HTTP-only cookies
- Protected Routes
- Forgot Password & Reset Password flow
- Email sending using Mailtrap
- Password strength meter
- Smooth animations with Framer Motion
- Clean & modern UI


## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Zustand (state management)
- Axios
- Framer Motion
- React Router

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JWT Authentication
- Mailtrap (Email service)
- bcryptjs
- cookie-parser


## ⚙️ Environment Variables

Create a `.env` file inside the **backend** folder and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
MAILTRAP_TOKEN=your_mailtrap_token
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```


## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Run backend

```bash
cd backend
npm run dev
```

### 5. Run frontend

```bash
cd frontend
npm run dev
```
