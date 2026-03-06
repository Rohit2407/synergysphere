from sqlalchemy import text
from .database import engine

def migrate_messages_table():
    with engine.begin() as conn:
        # Check if messages table exists
        table_exists = conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')"
        )).scalar()
        
        if not table_exists:
            return

        # Check existing columns
        columns = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'"
        )).fetchall()
        column_names = [row[0] for row in columns]

        # Add channel if missing
        if "channel" not in column_names:
            conn.execute(text("ALTER TABLE messages ADD COLUMN channel VARCHAR DEFAULT 'global'"))
            print("Added 'channel' column to messages table.")

        # Add task_id if missing
        if "task_id" not in column_names:
            conn.execute(text("ALTER TABLE messages ADD COLUMN task_id INTEGER REFERENCES tasks(id)"))
            print("Added 'task_id' column to messages table.")

        # Add project_id if missing (unlikely but safe)
        if "project_id" not in column_names:
            conn.execute(text("ALTER TABLE messages ADD COLUMN project_id INTEGER REFERENCES projects(id)"))
            print("Added 'project_id' column to messages table.")

if __name__ == "__main__":
    migrate_messages_table()
