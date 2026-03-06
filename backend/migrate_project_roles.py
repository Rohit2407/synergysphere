from sqlalchemy import text
from .database import engine

def migrate_project_member_roles():
    with engine.begin() as conn:
        col_info = conn.execute(text(
            "SELECT data_type, udt_name FROM information_schema.columns "
            "WHERE table_name = 'project_members' AND column_name = 'role'"
        )).fetchone()

        if not col_info:
            # Table might not exist yet if create_all hasn't finished or is a clean run
            return

        data_type, udt_name = col_info

        if data_type == "USER-DEFINED":
            old_type = udt_name
            new_type = f"{old_type}_v4" # Increment version to avoid conflicts if previously failed

            # 1. Create the new type
            conn.execute(text(f"DROP TYPE IF EXISTS {new_type}"))
            conn.execute(text(f"CREATE TYPE {new_type} AS ENUM ('manager','project_manager','employee','stakeholder')"))

            # 2. Alter column using a CASE to map old values to new enum values
            # This handles both the type change and the data migration in one step
            conn.execute(text(f"""
                ALTER TABLE project_members
                ALTER COLUMN role TYPE {new_type}
                USING (
                    CASE role::text
                        WHEN 'member' THEN 'employee'::text
                        WHEN 'viewer' THEN 'stakeholder'::text
                        ELSE role::text
                    END
                )::{new_type}
            """))

            # 3. Cleanup old type and rename
            conn.execute(text(f"DROP TYPE IF EXISTS {old_type} CASCADE"))
            conn.execute(text(f"ALTER TYPE {new_type} RENAME TO {old_type}"))
            conn.execute(text(f"ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'employee'::{old_type}"))
        else:
            # If it's TEXT, we can just update and add constraint
            conn.execute(text("UPDATE project_members SET role = 'employee' WHERE role = 'member'"))
            conn.execute(text("UPDATE project_members SET role = 'stakeholder' WHERE role = 'viewer'"))
            conn.execute(text("ALTER TABLE project_members ALTER COLUMN role TYPE TEXT USING role::text"))
            conn.execute(text("ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'employee'"))
            conn.execute(text("ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check"))
            conn.execute(text("ALTER TABLE project_members ADD CONSTRAINT project_members_role_check CHECK (role IN ('manager','project_manager','employee','stakeholder'))"))

if __name__ == "__main__":
    migrate_project_member_roles()
    print("Project member roles migrated successfully")
