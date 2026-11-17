# Todo App MVC + MongoDB + Redis (Part 1)

## Stack
- Node.js + Express 5
- MongoDB + Mongoose: persistent source of truth
- Redis: cache layer (not the primary database)
- Handlebars: server-rendered views and partials
- JWT in an HttpOnly cookie + bcrypt password hashing
- Bootstrap 5 for user pages
- AdminLTE 4 for admin pages (AdminLTE 4 is Bootstrap 5-based)

## Architecture
Browser -> Router -> Middleware -> Controller -> Service/Model
                                      |-> MongoDB (permanent data)
                                      |-> Redis (temporary cache)

Redis read strategy:
1. Controller/service checks Redis.
2. Cache hit: return cached data.
3. Cache miss: query MongoDB, write result to Redis with TTL, return result.
4. On create/update/delete, invalidate affected cache keys.

## Main features planned
- Register/login/logout
- Change password and profile
- User task CRUD, search and pagination
- Admin dashboard and statistics
- Admin user management and password change
- Role-based access control
- Redis cache with TTL and invalidation

## Setup (Windows PowerShell)
1. Install Node.js LTS, MongoDB Community Server and Redis (or use Docker for Redis).
2. Open this folder in VS Code.
3. Run:
   ```powershell
   Copy-Item .env.example .env
   npm install
   ```
4. Edit `.env` and set a strong JWT_SECRET.
5. Later parts will add runnable code; this Part 1 is the folder skeleton only.

## Important security decisions
- Passwords are stored only as bcrypt hashes.
- JWT is stored in an HttpOnly cookie, not localStorage.
- Every task query must be scoped to the logged-in user's id.
- Admin routes must pass both authentication and admin authorization.
- Redis cache keys must include user identity where data is user-specific.
