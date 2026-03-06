import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

conn_str = os.getenv("DATABASE_URL", "postgresql://postgres:2407@localhost:5432/synergysphere")
if conn_str.startswith("postgres://"):
    conn_str = conn_str.replace("postgres://", "postgresql://", 1)

engine = create_engine(conn_str)
with engine.connect() as connection:
    connection.execute(text("DROP TABLE IF EXISTS messages CASCADE;"))
    connection.commit()
    print("Messages table dropped successfully to clear old UUIDs.")
