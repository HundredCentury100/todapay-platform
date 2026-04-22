# Fulticket Docker Compose Setup

This repository includes Docker Compose configuration to run the entire Fulticket application stack locally.

## Services Included

The `compose.yaml` file defines the following services:

### Frontend
- **app** (Port 8080): React + Vite frontend application

### Supabase Backend Services
- **supabase-db** (Port 5432): PostgreSQL 15 database
- **supabase-studio** (Port 3000): Database management UI
- **supabase-kong** (Ports 8000, 8443): API Gateway
- **supabase-auth**: GoTrue authentication service
- **supabase-rest**: PostgREST API
- **supabase-realtime**: WebSocket/real-time subscriptions
- **supabase-storage**: File storage service
- **supabase-imgproxy**: Image transformation service
- **supabase-meta**: Database metadata API
- **supabase-functions**: Edge Functions (Deno runtime)
- **supabase-inbucket** (Ports 2500, 9000): Email testing server
- **supabase-vector**: Log aggregation and monitoring

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Bun runtime (for local development without Docker)
- At least 4GB of available RAM
- 10GB of free disk space

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your configuration:**
   - Change `POSTGRES_PASSWORD` to a secure password
   - Update `JWT_SECRET` with a random 32+ character string
   - Change `DASHBOARD_PASSWORD` to secure the Supabase dashboard
   - Configure email settings if needed

3. **Start all services:**
   ```bash
   docker compose up -d
   ```

4. **Check service status:**
   ```bash
   docker compose ps
   ```

5. **View logs:**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f app
   docker compose logs -f supabase-db
   ```

## Accessing Services

Once all services are running:

- **Frontend Application**: http://localhost:8080
- **Supabase API Gateway**: http://localhost:8000
- **Supabase Studio**: http://localhost:3000
- **Email Testing (Inbucket)**: http://localhost:9000
- **PostgreSQL Database**: localhost:5432

## Database Migrations

Migrations in `supabase/migrations/` are automatically applied when the database container starts.

To run migrations manually:
```bash
docker compose exec supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/YOUR_MIGRATION.sql
```

## Edge Functions

Edge functions in `supabase/functions/` are automatically loaded by the functions service.

To test a function:
```bash
curl -i --location --request POST 'http://localhost:8000/functions/v1/FUNCTION_NAME' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## Development Workflow

### Start services
```bash
docker compose up -d
```

### Stop services
```bash
docker compose down
```

### Rebuild the app container
```bash
docker compose up -d --build app
```

### Reset the database (warning: deletes all data)
```bash
docker compose down -v
docker compose up -d
```

### View real-time logs
```bash
docker compose logs -f app supabase-auth supabase-rest
```

## Troubleshooting

### Services fail to start
- Ensure no other services are using ports 3000, 5432, 8000, or 8080
- Check Docker daemon is running
- Review logs: `docker compose logs`

### Database connection issues
- Verify the database is healthy: `docker compose ps supabase-db`
- Check credentials in `.env` file match the connection strings

### Frontend can't connect to backend
- Ensure `SUPABASE_PUBLIC_URL` in `.env` is set to `http://localhost:8000`
- Check Kong gateway is running: `docker compose ps supabase-kong`

### Out of memory errors
- Increase Docker Desktop memory allocation (Settings > Resources)
- Stop unused containers: `docker ps -a` and `docker rm <container_id>`

## Production Considerations

For production deployment:

1. **Security:**
   - Generate strong random values for `JWT_SECRET`, `POSTGRES_PASSWORD`, and `DASHBOARD_PASSWORD`
   - Use proper SSL/TLS certificates
   - Enable firewall rules to restrict access

2. **Persistence:**
   - Use named volumes or bind mounts for database persistence
   - Implement regular backup strategy

3. **Scaling:**
   - Consider using managed Supabase hosting for production
   - Set up load balancing for the frontend
   - Use external PostgreSQL for better performance

4. **Monitoring:**
   - Enable Vector log aggregation
   - Set up health check monitoring
   - Configure alerts for service failures

## Useful Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service_name]

# Restart a service
docker compose restart [service_name]

# Execute command in container
docker compose exec [service_name] [command]

# Scale a service
docker compose up -d --scale app=3

# Clean up everything (including volumes)
docker compose down -v --remove-orphans
```

## Environment Variables Reference

See `.env.example` for all available configuration options.

Key variables:
- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: Secret for JWT token signing
- `ANON_KEY`: Public API key for anonymous access
- `SERVICE_ROLE_KEY`: Service role key for admin operations
- `SITE_URL`: Frontend application URL
- `API_EXTERNAL_URL`: Backend API URL

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
