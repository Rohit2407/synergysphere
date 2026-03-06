from sqlalchemy import text
from .database import engine

def migrate_core_multi_tenancy():
    print("Starting core multi-tenancy migration...")
    with engine.begin() as conn:
        # 1. Create AccountTypeEnum type if it doesn't exist
        # PostgreSQL doesn't have IF NOT EXISTS for CREATE TYPE directly in all versions, 
        # so we check pg_type.
        type_exists = conn.execute(text(
            "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accounttypeenum')"
        )).scalar()
        if not type_exists:
            conn.execute(text("CREATE TYPE accounttypeenum AS ENUM ('work', 'personal')"))
            print("Created 'accounttypeenum' type.")
        else:
            print("'accounttypeenum' type already exists.")

        # 2. Update users table with safer IF NOT EXISTS syntax (PG 9.6+)
        print("Updating 'users' table columns...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type accounttypeenum DEFAULT 'work'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_company_admin BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE"))

        # 3. Update projects table
        print("Updating 'projects' table columns...")
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)"))

        # 4. Update tasks table
        print("Updating 'tasks' table columns...")
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES tasks(id)"))
        
    print("Core multi-tenancy migration completed successfully.")

if __name__ == "__main__":
    migrate_core_multi_tenancy()
