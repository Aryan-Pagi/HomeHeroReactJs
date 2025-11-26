# HomeHero Backend Redeployment Guide

## 🚀 Deploying Backend from Your New Repository

Since you've changed the repository, here's how to redeploy your backend to Render:

---

## Option 1: Update Existing Render Service (Recommended)

### Step 1: Update Repository Connection

1. **Log in to Render Dashboard**: https://dashboard.render.com/
2. **Navigate to your backend service** (homehero-backend)
3. **Click "Settings"** tab
4. **Scroll to "Build & Deploy"** section
5. **Click "Disconnect" next to the old repository**
6. **Click "Connect a repository"**
7. **Select your new repository**: `Aryan-Pagi/HomeHeroReactJs`
8. **Set Root Directory**: `backend`
9. **Click "Save Changes"**

### Step 2: Trigger Manual Deploy

1. Go to the **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Render will pull from your new repository and redeploy

---

## Option 2: Create New Render Service

If you want a fresh deployment:

### Step 1: Create New Web Service

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. **Connect your repository**: `Aryan-Pagi/HomeHeroReactJs`
4. Configure the service:

```yaml
Name: homehero-backend
Region: Singapore (or closest to you)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: python scripts/render_startup.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Step 2: Configure Environment Variables

Add these environment variables in Render dashboard:

#### Required Variables:
```env
# Database (Auto-configured if using Render PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Security
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
DEBUG=False
PORT=10000

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379/0
```

#### Optional Variables (Add later):
```env
# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_secret

# Notifications
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@homehero.com

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Step 3: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: homehero-db
   - **Database**: homehero_db
   - **User**: homehero_user
   - **Region**: Same as your web service
3. Click **"Create Database"**
4. **Link to your web service**:
   - Go to your web service settings
   - Under "Environment", add `DATABASE_URL` and select "From Database"
   - Choose your PostgreSQL database

### Step 4: Run Database Migrations

After deployment, you need to run migrations:

#### Option A: Using Render Shell
1. Go to your web service in Render dashboard
2. Click **"Shell"** tab
3. Run:
```bash
cd backend
alembic upgrade head
```

#### Option B: Using render_startup.py (Automatic)
The `scripts/render_startup.py` already handles migrations automatically on startup.

---

## Option 3: Deploy Using render.yaml (Blueprint)

### Step 1: Update render.yaml

Your `backend/render.yaml` is already configured. Just ensure it has all new environment variables:

```yaml
databases:
  - name: homehero-db
    databaseName: homehero_db
    user: homehero_user
    plan: free  # or starter/standard

services:
  - type: web
    name: homehero-backend
    env: python
    region: singapore
    plan: free  # or starter/standard
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python scripts/render_startup.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: homehero-db
          property: connectionString
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: SECRET_KEY
        generateValue: true
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: false
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 30
```

### Step 2: Deploy via Blueprint

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. **Connect repository**: `Aryan-Pagi/HomeHeroReactJs`
4. **Blueprint path**: `backend/render.yaml`
5. Click **"Apply"**
6. Render will create all services defined in the YAML

---

## 🔧 Post-Deployment Steps

### 1. Verify Deployment

Check your backend is running:
```bash
curl https://your-app-name.onrender.com/
# Should return: {"message": "HomeHero API is running! 🔥", ...}

curl https://your-app-name.onrender.com/api/health
# Should return: {"status": "healthy", ...}
```

### 2. Test API Endpoints

Visit: `https://your-app-name.onrender.com/docs`

This opens the interactive Swagger UI where you can test all endpoints.

### 3. Run Migrations

If not run automatically:
```bash
# In Render Shell
alembic upgrade head
```

### 4. Create Initial Data (Optional)

If you want dummy data for testing:
```bash
# In Render Shell
python scripts/create_dummy_data.py
```

### 5. Update Frontend API URL

Update your frontend `.env` file:
```env
VITE_API_URL=https://your-app-name.onrender.com/api
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

1. Go to your Render service settings
2. Enable **"Auto-Deploy"**
3. Choose branch: `main`
4. Every push to `main` will automatically trigger a deployment

### Manual Deploy

Trigger manual deployment:
1. Go to Render dashboard → Your service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Monitoring Your Deployment

### View Logs

1. Go to Render dashboard → Your service
2. Click **"Logs"** tab
3. You'll see:
   - Build logs
   - Application logs
   - Error logs

### Health Checks

Render automatically monitors: `https://your-app-name.onrender.com/api/health`

If this endpoint fails, Render will restart your service.

---

## ⚠️ Common Issues & Solutions

### Issue 1: Database Connection Failed
**Solution**: 
- Verify `DATABASE_URL` is set correctly
- Ensure PostgreSQL database is in the same region
- Check database credentials

### Issue 2: Migration Errors
**Solution**:
```bash
# In Render Shell
cd backend
alembic current  # Check current version
alembic history  # View all migrations
alembic downgrade -1  # Rollback one version if needed
alembic upgrade head  # Apply all migrations
```

### Issue 3: Import Errors
**Solution**:
- Ensure all dependencies are in `requirements.txt`
- Check Python version matches (3.11)
- Rebuild the service

### Issue 4: Port Binding Error
**Solution**:
- Ensure start command uses `--port $PORT`
- Render automatically sets the `PORT` environment variable

### Issue 5: CORS Errors from Frontend
**Solution**:
Update `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.vercel.app",
        "http://localhost:5173"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Update CORS `allow_origins` to only your frontend domain
- [ ] Add all API keys as environment variables (never in code)
- [ ] Enable HTTPS (Render does this automatically)
- [ ] Set up Sentry for error monitoring
- [ ] Enable rate limiting (already configured in your app)
- [ ] Review database backup settings

---

## 📝 Quick Commands Reference

### Check Deployment Status
```bash
# View service info
render services list

# View logs
render logs <service-name>

# SSH into service
render shell <service-name>
```

### Database Commands
```bash
# Connect to database
render psql <database-name>

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1
```

---

## 🌐 Frontend Deployment (Vercel/Netlify)

After backend is deployed, update frontend:

### Update API URL
```env
# frontend/.env.production
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_your_key
```

### Deploy to Vercel
```bash
cd frontend
vercel --prod
```

### Deploy to Netlify
```bash
cd frontend
netlify deploy --prod
```

---

## 📞 Support

**Render Documentation**: https://render.com/docs
**Render Status**: https://status.render.com/
**Community Forum**: https://community.render.com/

---

## 🎯 Next Steps After Deployment

1. **Set up domain** (optional):
   - Add custom domain in Render settings
   - Update DNS records
   - Enable SSL (automatic with Render)

2. **Configure monitoring**:
   - Set up Sentry for error tracking
   - Enable uptime monitoring (UptimeRobot, Pingdom)
   - Set up log aggregation (Papertrail, Logtail)

3. **Performance optimization**:
   - Enable Redis for caching
   - Configure CDN for static files
   - Optimize database queries

4. **Backup strategy**:
   - Enable automated database backups in Render
   - Export critical data regularly
   - Test restore procedures

---

Good luck with your deployment! 🚀
