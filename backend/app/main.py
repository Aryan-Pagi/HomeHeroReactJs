from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sentry_sdk
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sqlalchemy import func

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging, LoggerMiddleware, get_logger
from app.core.exceptions import global_exception_handler
from app.core.rate_limiter import limiter, rate_limit_exceeded_handler
from app.routers import auth, users, providers, services, bookings, reviews, admin, verification, notifications, payments
from slowapi.errors import RateLimitExceeded

# setup logging
setup_logging()
logger = get_logger("main")

# setup sentry for error monitoring
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=1.0,
    send_default_pii=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    logger.info("Starting HomeHero API", environment=settings.ENVIRONMENT)
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.warning("⚠️ Database initialization skipped", error=str(e))

    try:
        from app.services.cache import cache

        cache.set("health_check", "ok", ttl=60)
        logger.info("Redis connection successful")

    except Exception as e:
        logger.warning("⚠️ Redis connection failed", error=str(e))

    yield
    # Shutdown
    logger.info("Shutting down HomeHero API")


app = FastAPI(
    title="HomeHero API",
    description="Local Service Finder for Small Towns",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# logging middleware
app.add_middleware(LoggerMiddleware)

# cors middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])


@app.get("/", response_model=dict)
async def root():
    logger.info("🏠 Root endpoint accessed")
    return {
        "message": "HomeHero API is running! 🔥",
        "status": "healthy",
        "features": [
            "🔐 JWT Authentication",
            "🚦 Rate Limiting",
            "📝 Input Validation",
            "🚨 Error Handling",
            "📊 Structured Logging",
            "📱 File Uploads",
            "💳 Payment Processing",
            "🔄 Redis Caching",
            "📲 Notifications",
            "🌍 Geolocation Search",
        ],
    }


@app.get("/api/health")
async def health_check():
    health_status = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "2.0.0",
        "timestamp": func.now(),
        "services": {},
    }

    # Check Redis
    # try:
    #     from app.services.cache import cache
    #     cache.set("health_check", "ok", ttl=10)
    #     cached_value = cache.get("health_check")
    #     health_status["services"]["redis"] = "healthy" if cached_value == "ok" else "unhealthy"
    # except:
    #     health_status["services"]["redis"] = "unhealthy"

    # Check external services
    health_status["services"]["cloudinary"] = (
        "configured" if settings.CLOUDINARY_CLOUD_NAME else "not_configured"
    )
    # health_status["services"]["razorpay"] = "configured" if settings.RAZORPAY_KEY_ID else "not_configured"
    health_status["services"]["notifications"] = (
        "configured" if settings.TWILIO_ACCOUNT_SID else "not_configured"
    )
