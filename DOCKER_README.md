# 🐳 Docker Setup for Repeeker Server

This document provides comprehensive instructions for running the Repeeker server using Docker and Docker Compose.

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

## 🚀 Quick Start

### Development Setup

```bash
# Run the setup script
./scripts/docker-setup.sh

# Or manually:
docker-compose up -d
```

### Production Setup

```bash
# Create production environment file
cp .env.production.example .env.production
# Edit .env.production with your values

# Run production setup
./scripts/docker-setup.sh production

# Or manually:
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 📁 File Structure

```
├── docker-compose.yml              # Development configuration
├── docker-compose.prod.yml         # Production configuration
├── Dockerfile                      # Application container
├── nginx.conf                      # Nginx configuration
├── scripts/
│   ├── docker-setup.sh            # Automated setup script
│   ├── backup.sh                  # Database backup script
│   └── restore.sh                 # Database restore script
└── .env.production.example         # Production environment template
```

## 🔧 Services

### Development Environment (`docker-compose.yml`)

| Service | Port | Description |
|---------|------|-------------|
| **app** | 8080 | Main Node.js application |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache (optional) |
| **nginx** | 80, 443 | Reverse proxy (production profile) |

### Production Environment (`docker-compose.prod.yml`)

All services include:
- Resource limits
- Health checks
- Automatic restart policies
- Security enhancements
- Database backup service

## 🌍 Environment Variables

### Required Variables (Production)

```bash
# Database
POSTGRES_DB=repeeker_db
POSTGRES_USER=repeeker_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Application
JWT_SECRET=your_jwt_secret_32_chars_minimum
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_minimum
CORS_ORIGIN=https://your-domain.com

# External APIs
OPENAI_API_KEY=your_openai_api_key
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info                    # debug, info, warn, error

# Backup
BACKUP_SCHEDULE="0 2 * * *"      # Daily at 2 AM

# OpenAI
OPENAI_MODEL=gpt-4-turbo-preview
```

## 📝 Common Commands

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart app

# Run database migrations
docker-compose exec app npm run prisma:migrate

# Access database
docker-compose exec postgres psql -U repeeker_user -d repeeker_db

# Stop all services
docker-compose down

# Remove all data (volumes)
docker-compose down -v
```

### Production

```bash
# Start production services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale application (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=2

# Run backup
docker-compose -f docker-compose.prod.yml exec db_backup /usr/local/bin/backup.sh

# Restore from backup
docker-compose -f docker-compose.prod.yml exec db_backup /usr/local/bin/restore.sh /backups/backup_file.sql.gz
```

## 💾 Database Management

### Backups

Automatic backups are configured in production:
- Daily backups at 2 AM (configurable)
- 7-day retention policy
- Both custom and SQL formats
- Stored in `./backups/` directory

### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U repeeker_user -d repeeker_db > backup.sql

# Or use the backup service
docker-compose exec db_backup /usr/local/bin/backup.sh
```

### Restore

```bash
# Restore from backup file
docker-compose exec db_backup /usr/local/bin/restore.sh /backups/backup_file.sql.gz
```

### Migrations

```bash
# Run Prisma migrations
docker-compose exec app npm run prisma:migrate

# Generate Prisma client
docker-compose exec app npm run prisma:generate

# Reset database (development only)
docker-compose exec app npx prisma migrate reset
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

- App: `http://localhost:8080/health`
- Database: Automatic PostgreSQL health check
- Redis: Automatic Redis ping check

### Viewing Service Status

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

## 🛡️ Security Considerations

### Production Security

- All services run with resource limits
- Non-root user in containers
- Secrets managed via environment variables
- Network isolation with custom bridge
- Redis password protection
- Regular security updates via base images

### SSL/TLS Setup

1. Place your certificates in the `ssl/` directory:
   ```
   ssl/
   ├── repeeker.com.crt
   └── repeeker.com.key
   ```

2. Update `nginx.conf` with your domain name

3. Restart nginx service:
   ```bash
   docker-compose restart nginx
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5432
   
   # Change port in docker-compose.yml if needed
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

2. **Permission issues**
   ```bash
   # Fix log directory permissions
   sudo chown -R $USER:$USER logs/
   
   # Make scripts executable
   chmod +x scripts/*.sh
   ```

3. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec app npm run prisma:studio
   ```

4. **Memory issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Adjust memory limits in docker-compose.prod.yml
   ```

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove unused images
docker system prune -a

# Start fresh
docker-compose up -d --build
```

## 📊 Performance Tuning

### Production Optimizations

1. **Database tuning** - Adjust PostgreSQL settings in `docker-compose.prod.yml`
2. **Redis configuration** - Enable persistence and optimize memory
3. **Nginx caching** - Configure static file caching
4. **Application scaling** - Use multiple app instances
5. **Resource limits** - Set appropriate CPU/memory limits

### Monitoring

Consider adding these monitoring tools:
- Prometheus + Grafana for metrics
- ELK stack for log aggregation
- Sentry for error tracking

## 🔗 Useful Links

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
- [Prisma Documentation](https://prisma.io/docs) 