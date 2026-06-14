from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine, SessionLocal
from app.core.settings import get_settings
from app.models import all as _models  # noqa: F401
from app.models.room import Room
from app.routers.bets import router as bets_router
from app.routers.leaderboard import router as leaderboard_router
from app.routers.matches import router as matches_router
from app.routers.results import router as results_router
from app.routers.rooms import router as rooms_router
from app.routers.stats import router as stats_router

settings = get_settings()

Base.metadata.create_all(bind=engine)

# Ensure `locked` column exists on older DBs created before the column was added.
from sqlalchemy import text


def ensure_locked_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT locked FROM rooms LIMIT 1"))
        except Exception:
            # Column missing -> attempt to add it. Different SQL for sqlite vs postgres
            if settings.database_url.startswith("sqlite"):
                try:
                    conn.execute(
                        text(
                            "ALTER TABLE rooms ADD COLUMN locked BOOLEAN NOT NULL DEFAULT 0"
                        )
                    )
                except Exception:
                    pass
            else:
                try:
                    conn.execute(
                        text(
                            "ALTER TABLE rooms ADD COLUMN locked boolean NOT NULL DEFAULT false"
                        )
                    )
                except Exception:
                    pass


def seed_default_room() -> None:
    ensure_locked_column()
    db = SessionLocal()
    try:
        exists = db.query(Room).filter(Room.code == "DEFAULT").first()
        if exists is None:
            db.add(Room(code="DEFAULT"))
            db.commit()
    finally:
        db.close()


seed_default_room()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms_router)
app.include_router(matches_router)
app.include_router(bets_router)
app.include_router(results_router)
app.include_router(leaderboard_router)
app.include_router(stats_router)

# auth router
from app.routers.auth import router as auth_router

app.include_router(auth_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
