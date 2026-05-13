PS C:\Users\fripe\OneDrive\Escritorio\proyecto_integrador_ferreteria\ferreteria\backend> npm run db:migrate

> ferresync-backend@1.0.0 db:migrate
> npx prisma migrate dev

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "ferresync_dev", schema "public" at "localhost:5432"

Error: P3006

Migration `20260427193000_add_rag` failed to apply cleanly to the shadow database. 
Error:
ERROR: extension "vector" is not available
DETAIL: Could not open extension control file "/usr/local/share/postgresql/extension/vector.control": No such file or directory.
HINT: The extension must first be installed on the system where PostgreSQL is running.
   0: sql_schema_connector::validate_migrations
           with namespaces=None
             at schema-engine\connectors\sql-schema-connector\src\lib.rs:335
   1: schema_core::state::DevDiagnostic
             at schema-engine\core\src\state.rs:276

PS C:\Users\fripe\OneDrive\Escritorio\proyecto_integrador_ferreteria\ferreteria\backend> 
