# Investment Platform - Deployment Guide

This project is a full-stack application with a **React** frontend and an **Express** backend.

## 🚀 Deployment on Vercel

This project includes a `vercel.json` configuration to deploy both the frontend and backend on Vercel.

### 🗄️ Database Setup (PostgreSQL)

This project uses **PostgreSQL**. You need a cloud database to deploy on Vercel.

1.  **Get a Free Database**:
    *   **Neon**: [https://neon.tech](https://neon.tech) (Recommended)
    *   **Supabase**: [https://supabase.com](https://supabase.com)
    *   **Vercel Postgres**: Available in the Vercel dashboard.

2.  **Get Connection String**:
    *   Copy the "Connection String" or "DATABASE_URL" from your provider.
    *   It looks like: `postgresql://user:password@host:port/database`

3.  **Configure Environment Variables**:
    *   **Local Development**: Create a `.env` file in the `server` folder:
        ```env
        DATABASE_URL=your_connection_string_here
        JWT_SECRET=your_secret_key
        ```
    *   **Vercel Deployment**:
        *   Go to your Project Settings > Environment Variables.
        *   Add `DATABASE_URL` with your connection string.
        *   Add `JWT_SECRET` with a secure random string.

### How to Deploy

1.  Push this code to **GitHub**.
2.  Log in to **Vercel** and click **"Add New Project"**.
3.  Import your GitHub repository.
4.  **Add Environment Variables** (DATABASE_URL, JWT_SECRET) during the setup step.
5.  Click **Deploy**.

### Configuration Details

- **Frontend**: Serves from `/` (Client).
- **Backend**: API runs at `/api/*` (Server).
- **Environment**: The `vercel.json` maps requests to the correct service.

## Local Development

1.  **Backend**:
    ```bash
    cd server
    npm install
    # Make sure you have .env with DATABASE_URL
    node index.js
    ```
2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
