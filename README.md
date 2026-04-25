# Rankved GMB Manager (GBP Scheduler)

![Rankved GMB Manager Banner](./public/logo.png)

Rankved GMB Manager is a powerful, enterprise-grade SaaS platform built to help marketing agencies and franchise businesses automate, manage, and schedule posts across multiple Google Business Profiles (GBP) from a single unified dashboard.

## 🚀 What It Does

Rankved GMB Manager eliminates the tedious process of logging in and out of different Google accounts to post updates for clients. 

- **Multi-Location Management:** Seamlessly sync and manage dozens of Google Business Profile locations.
- **Automated Scheduling:** Write posts now, schedule them for later. The integrated cron jobs push updates directly to Google at your exact specified time.
- **Role-Based Access Control (RBAC):** Perfect for teams! Includes robust permission sets for Super Admins, Agency Owners, and Team Members. Restrict junior staff from publishing directly and require scheduled reviews.
- **Performance Analytics:** Real-time metrics synced directly from Google (Views, Clicks, Calls, Direction requests).
- **Post Variety:** Support for Standard updates, Events (with start/end dates), and Offers (with coupon codes and terms).

## 🎯 Who It's For

- **Digital Marketing Agencies:** Manage all your clients' GBP updates without sharing master Google account passwords with your staff.
- **Franchise Owners:** Keep your local listings updated with fresh content simultaneously.
- **Local SEO Specialists:** Automate local signals through consistent, high-quality GBP updates.

## 🛠️ How To Use It

1. **Connect:** The Agency Owner logs in and connects their Google Account via OAuth.
2. **Sync:** Click "Fetch Profiles" to automatically sync all managed Google Business Profile locations into the dashboard.
3. **Assign:** (Optional) Add Team Members and grant them access to specific locations with custom scheduling limits.
4. **Create & Schedule:** Navigate to "Create Post", select the profile, craft your update (with media and CTA buttons), and hit "Schedule". 
5. **Relax:** The system automatically pushes the post to the Google My Business API at the right time.

## 📸 Dashboard Preview

*(Add your screenshots here!)*

- `![Dashboard Overview](./docs/screenshots/dashboard.png)`
- `![Post Editor & Scheduler](./docs/screenshots/editor.png)`
- `![Performance Analytics](./docs/screenshots/analytics.png)`

## ⚙️ Setup & Installation

Follow these instructions to get your own instance running locally:

### 1. Clone the repository
```bash
git clone https://github.com/smritivarnaha/rankved-gmb.git
cd rankved-gmb
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your configuration. You will need a PostgreSQL database (e.g., Supabase) and Google Cloud Console credentials with the **Google My Business API** enabled.

```env
# Database (Prisma / Supabase)
DATABASE_URL="postgresql://user:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@aws-0-region.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-strong-secret-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Database Setup
Run Prisma migrations to set up your database schema:
```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The default initial Super Admin account can be created on first launch or seeded directly in the database.

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Custom Enterprise Light Theme CSS (Global variables) + Lucide Icons
- **Deployment:** Vercel

## 📄 License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.
