import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

conn_str = os.getenv("DATABASE_URL", "postgresql://postgres:2407@localhost:5432/synergysphere")
if conn_str.startswith("postgres://"):
    conn_str = conn_str.replace("postgres://", "postgresql://", 1)

engine = create_engine(conn_str)
with engine.connect() as connection:
    # Drops everything in the public schema
    connection.execute(text("DROP SCHEMA public CASCADE;"))
    connection.execute(text("CREATE SCHEMA public;"))
    connection.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
    connection.execute(text("GRANT ALL ON SCHEMA public TO public;"))
    connection.commit()
    print("Database completely reset! Old UUID tables wiped.")
