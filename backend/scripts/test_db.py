import os
import sys

try:
    import psycopg
except Exception as e:
    print("psycopg not installed:", e)
    sys.exit(2)

url = os.environ.get("DATABASE_URL")
if not url:
    print("NO_DATABASE_URL")
    sys.exit(2)

# psycopg.connect expects a normal postgresql:// URL; SQLAlchemy uses postgresql+psycopg://
if url.startswith("postgresql+psycopg://"):
    url = url.replace("postgresql+psycopg://", "postgresql://", 1)

try:
    conn = psycopg.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("OK", cur.fetchone())
    cur.close()
    conn.close()
except Exception as e:
    print("DB_CONN_ERROR", e)
    sys.exit(1)
