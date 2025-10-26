# Production Queue Worker Setup

## Why Queue Worker is Needed

The Laravel queue system requires a background worker to process jobs. The email system queues emails and sends them via N8n webhooks, but these emails won't be sent until the queue worker processes them.

## Option 1: Setup with Supervisor (Recommended for Production)

### 1. Create Supervisor Configuration

Create a new Supervisor configuration file:

```bash
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

Add the following content:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/timesovh/naqashthaheem.com/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=timesovh
numprocs=2
redirect_stderr=true
stdout_logfile=/home/timesovh/naqashthaheem.com/backend/storage/logs/worker.log
stopwaitsecs=3600
```

### 2. Update Supervisor Configuration

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

### 3. Monitor Queue Worker

```bash
# Check status
sudo supervisorctl status

# View logs
tail -f ~/naqashthaheem.com/backend/storage/logs/worker.log

# Restart worker
sudo supervisorctl restart laravel-worker:*
```

## Option 2: Setup with Systemd (Alternative)

### 1. Create Systemd Service File

```bash
sudo nano /etc/systemd/system/laravel-queue.service
```

Add the following content:

```ini
[Unit]
Description=Laravel Queue Worker
After=network.target

[Service]
User=timesovh
Group=timesovh
WorkingDirectory=/home/timesovh/naqashthaheem.com/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable laravel-queue
sudo systemctl start laravel-queue
sudo systemctl status laravel-queue
```

## Option 3: GitHub Actions Workflow (Automated)

The production deployment workflow should already include queue worker setup. Check `.github/workflows/deploy-production.yml` for queue worker configuration.

If not present, add this step to the deployment workflow:

```yaml
- name: Start Queue Worker
  run: |
    sudo supervisorctl restart laravel-worker:* || \
    sudo systemctl restart laravel-queue || \
    nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 > /tmp/laravel-queue.log 2>&1 &
```

## Current Production Status

To check if the queue worker is running in production:

```bash
ssh -p 21098 timesovh@162.254.39.126

# Check for running queue workers
ps aux | grep "queue:work"

# Check queue status
cd ~/naqashthaheem.com/backend
php artisan queue:work --once  # Test manually

# Check email queue status
php artisan tinker --execute='echo "Pending: " . App\Models\EmailQueue::where("status", "pending")->count();'
```

## Troubleshooting

### Queue Worker Not Processing Emails

1. **Check if worker is running:**
   ```bash
   ps aux | grep "queue:work"
   ```

2. **Check Laravel logs:**
   ```bash
   tail -f ~/naqashthaheem.com/backend/storage/logs/laravel.log
   ```

3. **Manually test queue processing:**
   ```bash
   cd ~/naqashthaheem.com/backend
   php artisan queue:work --once
   php artisan email:process-queue
   ```

### Queue Worker Keeps Dying

If the queue worker keeps dying, increase the resources:

1. Update `max_time` to prevent timeouts
2. Check server memory limits
3. Consider using multiple workers (numprocs=2)

### Emails Not Being Sent

1. **Check N8n configuration:**
   - Login to admin panel
   - Go to "N8n Configuration"
   - Ensure one configuration is "Active"
   - Test the connection

2. **Check email queue:**
   ```bash
   php artisan tinker --execute='App\Models\EmailQueue::orderBy("created_at", "desc")->limit(5)->get();'
   ```

3. **Check email logs:**
   ```bash
   php artisan tinker --execute='App\Models\EmailLog::orderBy("created_at", "desc")->limit(5)->get();'
   ```

## Manual Queue Processing

If you need to manually process the queue:

```bash
cd ~/naqashthaheem.com/backend
php artisan queue:work --tries=3 --timeout=120
```

Or use the scheduled command:

```bash
php artisan email:process-queue
php artisan schedule:run
```

## Production Checklist

- [ ] Queue worker is running (check with `ps aux | grep queue:work`)
- [ ] N8n configuration is active in admin panel
- [ ] Test forgot password flow sends email
- [ ] Check email queue status (should have 0 pending)
- [ ] Monitor logs for any errors
- [ ] Set up log rotation to prevent disk space issues

## Contact & Support

If you encounter issues with the queue worker setup, check:
1. Laravel logs: `~/naqashthaheem.com/backend/storage/logs/laravel.log`
2. Queue worker logs: Check Supervisor/Systemd logs
3. Email queue: Admin panel → Email Queue
4. Email logs: Admin panel → Email Logs

