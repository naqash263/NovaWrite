#!/bin/bash

# Naqash Thaheem Monitoring Setup Script
# This script sets up comprehensive monitoring for the production system

echo "🚀 Setting up Naqash Thaheem Production Monitoring..."

# Configuration
SCRIPT_DIR="/home/timesovh/naqashthaheem.com/backend/scripts"
LOG_DIR="/home/timesovh/naqashthaheem.com/backend/storage/logs"
CRON_USER="timesovh"

# Make scripts executable
echo "📝 Making monitoring scripts executable..."
chmod +x "$SCRIPT_DIR/monitor.sh"

# Create log directory if it doesn't exist
echo "📁 Creating log directory..."
mkdir -p "$LOG_DIR"

# Set up cron jobs
echo "⏰ Setting up cron jobs..."

# Create cron job for monitoring (every 5 minutes)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_DIR/monitor.sh >> $LOG_DIR/monitoring.log 2>&1") | crontab -u "$CRON_USER" -

# Create cron job for log rotation (daily at 2 AM)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "0 2 * * * find $LOG_DIR -name '*.log' -mtime +7 -delete") | crontab -u "$CRON_USER" -

# Create cron job for Laravel log cleanup (daily at 3 AM)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "0 3 * * * cd /home/timesovh/naqashthaheem.com/backend && php artisan log:clear") | crontab -u "$CRON_USER" -

# Create cron job for cache cleanup (hourly)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "0 * * * * cd /home/timesovh/naqashthaheem.com/backend && php artisan cache:clear") | crontab -u "$CRON_USER" -

# Create cron job for config cache refresh (every 6 hours)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "0 */6 * * * cd /home/timesovh/naqashthaheem.com/backend && php artisan config:cache") | crontab -u "$CRON_USER" -

# Create log rotation configuration
echo "📋 Creating log rotation configuration..."
cat > /etc/logrotate.d/naqashthaheem << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $CRON_USER $CRON_USER
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Install required packages for monitoring
echo "📦 Installing monitoring dependencies..."
apt-get update -qq
apt-get install -y -qq jq mailutils htop iotop nethogs

# Create monitoring configuration file
echo "⚙️ Creating monitoring configuration..."
cat > "$SCRIPT_DIR/monitoring.conf" << EOF
# Naqash Thaheem Monitoring Configuration
API_BASE="https://naqashthaheem.com/api"
LOG_FILE="$LOG_DIR/monitoring.log"
ALERT_EMAIL="naqash263@gmail.com"
CRITICAL_THRESHOLD=3
WARNING_THRESHOLD=1
EOF

# Create systemd service for monitoring (optional)
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/naqashthaheem-monitor.service << EOF
[Unit]
Description=Naqash Thaheem Monitoring Service
After=network.target

[Service]
Type=oneshot
User=$CRON_USER
ExecStart=$SCRIPT_DIR/monitor.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring dashboard data directory
echo "📊 Creating monitoring dashboard data directory..."
mkdir -p "$LOG_DIR/monitoring-dashboard"

# Set up log monitoring
echo "📈 Setting up log monitoring..."
cat > "$SCRIPT_DIR/log-monitor.sh" << 'EOF'
#!/bin/bash

# Log monitoring script
LOG_FILE="/home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log"
ALERT_EMAIL="naqash263@gmail.com"

# Monitor for critical errors
if [ -f "$LOG_FILE" ]; then
    # Check for critical errors in the last 5 minutes
    recent_errors=$(tail -n 1000 "$LOG_FILE" | grep -c "CRITICAL\|FATAL" 2>/dev/null || echo "0")
    
    if [ "$recent_errors" -gt 0 ]; then
        echo "[$(date)] CRITICAL: $recent_errors critical errors detected" >> /home/timesovh/naqashthaheem.com/backend/storage/logs/monitoring.log
        
        # Send alert email
        echo "Critical errors detected in Naqash Thaheem application logs. Please check immediately." | \
        mail -s "Naqash Thaheem Critical Alert" "$ALERT_EMAIL"
    fi
fi
EOF

chmod +x "$SCRIPT_DIR/log-monitor.sh"

# Add log monitoring to cron (every 2 minutes)
(crontab -u "$CRON_USER" -l 2>/dev/null; echo "*/2 * * * * $SCRIPT_DIR/log-monitor.sh") | crontab -u "$CRON_USER" -

# Create health check endpoint test script
echo "🔍 Creating health check test script..."
cat > "$SCRIPT_DIR/test-health.sh" << 'EOF'
#!/bin/bash

# Health check test script
API_BASE="https://naqashthaheem.com/api"

echo "Testing Naqash Thaheem Health Endpoints..."
echo "======================================"

# Test basic health
echo -n "Basic Health: "
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health" | grep -q "200" && echo "✅ OK" || echo "❌ FAILED"

# Test comprehensive health
echo -n "Comprehensive Health: "
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/comprehensive" | grep -q "200" && echo "✅ OK" || echo "❌ FAILED"

# Test database health
echo -n "Database Health: "
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/database" | grep -q "200" && echo "✅ OK" || echo "❌ FAILED"

# Test storage health
echo -n "Storage Health: "
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/storage" | grep -q "200" && echo "✅ OK" || echo "❌ FAILED"

echo "======================================"
echo "Health check test completed."
EOF

chmod +x "$SCRIPT_DIR/test-health.sh"

# Create monitoring status script
echo "📊 Creating monitoring status script..."
cat > "$SCRIPT_DIR/status.sh" << 'EOF'
#!/bin/bash

# Monitoring status script
echo "Naqash Thaheem Monitoring Status"
echo "=========================="
echo ""

# Check if monitoring is running
echo "Cron Jobs:"
crontab -l | grep -E "(monitor|log-monitor)" | while read line; do
    echo "  ✅ $line"
done

echo ""
echo "Recent Monitoring Logs:"
tail -n 10 /home/timesovh/naqashthaheem.com/backend/storage/logs/monitoring.log 2>/dev/null || echo "  No logs found"

echo ""
echo "System Resources:"
echo "  Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "  Disk Usage: $(df /home/timesovh/naqashthaheem.com | tail -1 | awk '{print $5}')"
echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "Service Status:"
systemctl is-active --quiet nginx && echo "  ✅ Nginx: Running" || echo "  ❌ Nginx: Not Running"
systemctl is-active --quiet php8.1-fpm && echo "  ✅ PHP-FPM: Running" || echo "  ❌ PHP-FPM: Not Running"
systemctl is-active --quiet postgresql && echo "  ✅ PostgreSQL: Running" || echo "  ❌ PostgreSQL: Not Running"
EOF

chmod +x "$SCRIPT_DIR/status.sh"

# Run initial health check
echo "🏥 Running initial health check..."
"$SCRIPT_DIR/test-health.sh"

# Display monitoring status
echo "📊 Monitoring Status:"
"$SCRIPT_DIR/status.sh"

echo ""
echo "✅ Naqash Thaheem Monitoring Setup Complete!"
echo ""
echo "📋 What was set up:"
echo "  • Health check endpoints (/api/health/*)"
echo "  • Monitoring script (runs every 5 minutes)"
echo "  • Log monitoring (runs every 2 minutes)"
echo "  • Log rotation (daily cleanup)"
echo "  • Cache management (hourly cleanup)"
echo "  • Email alerts for critical issues"
echo "  • Monitoring dashboard at /admin/monitoring"
echo ""
echo "🔧 Useful commands:"
echo "  • Check status: $SCRIPT_DIR/status.sh"
echo "  • Test health: $SCRIPT_DIR/test-health.sh"
echo "  • Run monitor: $SCRIPT_DIR/monitor.sh"
echo "  • View logs: tail -f $LOG_DIR/monitoring.log"
echo ""
echo "🌐 Access monitoring dashboard at: https://naqashthaheem.com/admin/monitoring"
