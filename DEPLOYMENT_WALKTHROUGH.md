# 🚀 Step-by-Step Deployment Guide

Follow these steps to get your Investment Platform live on the internet with a real database.

---

## Phase 1: Get a Free Cloud Database (PostgreSQL)

Since Vercel is "serverless" (it doesn't save files permanently), we need a separate place to store your data (users, balance, investments). We will use **Neon** (it's free and easy).

1.  **Go to Neon**: Visit [https://neon.tech](https://neon.tech) and click **Sign Up**.
2.  **Create a Project**:
    *   Name it `investment-platform`.
    *   Region: Choose one close to you (e.g., Europe or US East).
    *   Click **Create Project**.
3.  **Get Connection String**:
    *   On your dashboard, look for the **Connection Details** section.
    *   You will see a string that looks like: `postgres://neondb_owner:AbC123...@ep-cool-frog.aws.neon.tech/neondb?sslmode=require`
    *   **Copy this string**. Keep it safe!

---

## Phase 2: Configure Local Environment (Optional but Recommended)

To test if everything works before deploying:

1.  Open your project in Trae/VS Code.
2.  Navigate to `investment_platform/server/.env`.
3.  Find the `DATABASE_URL` line and paste your Neon connection string:
    ```env
    DATABASE_URL=postgres://neondb_owner:AbC123...@ep-cool-frog.aws.neon.tech/neondb?sslmode=require
    ```
4.  Run the server locally to check connection:
    ```bash
    cd investment_platform/server
    node index.js
    ```
    *   If you see `Server running on http://localhost:3001` and `PostgreSQL Database initialized`, you are good!

---

## Phase 3: Push Code to GitHub

Vercel grabs your code from GitHub.

1.  **Create a GitHub Repo**: Go to [github.com/new](https://github.com/new) and name it `investment-platform`.
2.  **Push your code**:
    *   Open your terminal in the project root.
    *   Run these commands:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/investment-platform.git
        git push -u origin main
        ```

---

## Phase 4: Deploy to Vercel

1.  **Go to Vercel**: Visit [vercel.com](https://vercel.com) and Log In.
2.  **Add New Project**:
    *   Click **Add New...** > **Project**.
    *   Select your `investment-platform` repository from GitHub.
3.  **Configure Project**:
    *   **Framework Preset**: It might say "Vite" or "Other". "Other" or default is fine.
    *   **Root Directory**: Click "Edit" and select `investment_platform` (the folder containing both client and server).
4.  **Environment Variables** (CRITICAL STEP):
    *   Expand the **Environment Variables** section.
    *   Add variable 1:
        *   **Name**: `DATABASE_URL`
        *   **Value**: (Paste your Neon connection string from Phase 1)
    *   Add variable 2:
        *   **Name**: `JWT_SECRET`
        *   **Value**: `any-long-random-secret-string` (e.g., `my-super-secure-app-key-2024`)
5.  **Deploy**:
    *   Click **Deploy**.
    *   Wait ~1 minute. You should see a "Congratulations!" screen.

---

## Phase 5: Verification

1.  Click the **Visit** button on your Vercel dashboard.
2.  Try to **Register** a new user.
    *   If it works, your database is connected!
3.  Try to **Deposit** money.
    *   If the balance updates, your API is working!

**🎉 You are live!**
