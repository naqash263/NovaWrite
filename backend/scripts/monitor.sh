#!/bin/bash

# Naqash Thaheem Production Monitoring Script
# This script monitors critical aspects of the production system

# Configuration
API_BASE="https://naqashthaheem.com/api"
LOG_FILE="/home/timesovh/naqashthaheem.com/backend/storage/logs/monitoring.log"
ALERT_EMAIL="naqash263@gmail.com"
CRITICAL_THRESHOLD=3
WARNING_THRESHOLD=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
send_alert() {
    local level=$1
    local message=$2
    local details=$3
    
    log "ALERT [$level]: $message"
    
    # Send email alert (requires mailutils or similar)
    if command -v mail &> /dev/null; then
        echo -e "Subject: Naqash Thaheem Production Alert - $level\n\n$message\n\nDetails:\n$details\n\nTime: $(date)" | mail -s "Naqash Thaheem Alert - $level" "$ALERT_EMAIL"
    fi
    
    # Log to system log
    logger "Naqash Thaheem Alert [$level]: $message"
}

# Check API health
check_api_health() {
    log "Checking API health..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE/health")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log "✅ API Health: OK"
        return 0
    else
        send_alert "CRITICAL" "API Health Check Failed" "HTTP Code: $http_code"
        return 1
    fi
}

# Check comprehensive health
check_comprehensive_health() {
    log "Checking comprehensive health..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/comprehensive_health.json "$API_BASE/health/comprehensive")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        local status=$(jq -r '.status' /tmp/comprehensive_health.json 2>/dev/null || echo "unknown")
        local critical_issues=$(jq -r '.critical_issues' /tmp/comprehensive_health.json 2>/dev/null || echo "0")
        
        if [ "$status" = "healthy" ]; then
            log "✅ Comprehensive Health: OK"
            return 0
        elif [ "$status" = "warning" ]; then
            send_alert "WARNING" "System Health Warning" "Status: $status, Critical Issues: $critical_issues"
            return 1
        else
            send_alert "CRITICAL" "System Health Critical" "Status: $status, Critical Issues: $critical_issues"
            return 2
        fi
    else
        send_alert "CRITICAL" "Comprehensive Health Check Failed" "HTTP Code: $http_code"
        return 2
    fi
}

# Check database health
check_database_health() {
    log "Checking database health..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/db_health.json "$API_BASE/health/database")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        local response_time=$(jq -r '.response_time_ms' /tmp/db_health.json 2>/dev/null || echo "0")
        log "✅ Database Health: OK (${response_time}ms)"
        return 0
    else
        send_alert "CRITICAL" "Database Health Check Failed" "HTTP Code: $http_code"
        return 1
    fi
}

# Check storage health
check_storage_health() {
    log "Checking storage health..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/storage_health.json "$API_BASE/health/storage")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        local response_time=$(jq -r '.response_time_ms' /tmp/storage_health.json 2>/dev/null || echo "0")
        log "✅ Storage Health: OK (${response_time}ms)"
        return 0
    else
        send_alert "CRITICAL" "Storage Health Check Failed" "HTTP Code: $http_code"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space..."
    
    local usage=$(df /home/timesovh/naqashthaheem.com | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        send_alert "CRITICAL" "Disk Space Critical" "Usage: ${usage}%"
        return 2
    elif [ "$usage" -gt 80 ]; then
        send_alert "WARNING" "Disk Space Warning" "Usage: ${usage}%"
        return 1
    else
        log "✅ Disk Space: OK (${usage}%)"
        return 0
    fi
}

# Check memory usage
check_memory_usage() {
    log "Checking memory usage..."
    
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$memory_usage" -gt 90 ]; then
        send_alert "CRITICAL" "Memory Usage Critical" "Usage: ${memory_usage}%"
        return 2
    elif [ "$memory_usage" -gt 80 ]; then
        send_alert "WARNING" "Memory Usage Warning" "Usage: ${memory_usage}%"
        return 1
    else
        log "✅ Memory Usage: OK (${memory_usage}%)"
        return 0
    fi
}

# Check PHP-FPM status
check_php_fpm() {
    log "Checking PHP-FPM status..."
    
    if systemctl is-active --quiet php8.1-fpm; then
        log "✅ PHP-FPM: Running"
        return 0
    else
        send_alert "CRITICAL" "PHP-FPM Not Running" "PHP-FPM service is down"
        return 1
    fi
}

# Check Nginx status
check_nginx() {
    log "Checking Nginx status..."
    
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx: Running"
        return 0
    else
        send_alert "CRITICAL" "Nginx Not Running" "Nginx service is down"
        return 1
    fi
}

# Check PostgreSQL status
check_postgresql() {
    log "Checking PostgreSQL status..."
    
    if systemctl is-active --quiet postgresql; then
        log "✅ PostgreSQL: Running"
        return 0
    else
        send_alert "CRITICAL" "PostgreSQL Not Running" "PostgreSQL service is down"
        return 1
    fi
}

# Check recent error logs
check_error_logs() {
    log "Checking recent error logs..."
    
    local error_count=$(grep -c "ERROR\|CRITICAL" /home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log 2>/dev/null | tail -1)
    local recent_errors=$(find /home/timesovh/naqashthaheem.com/backend/storage/logs -name "*.log" -mmin -60 -exec grep -c "ERROR\|CRITICAL" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    if [ "$recent_errors" -gt "$CRITICAL_THRESHOLD" ]; then
        send_alert "CRITICAL" "High Error Rate Detected" "Recent errors: $recent_errors"
        return 2
    elif [ "$recent_errors" -gt "$WARNING_THRESHOLD" ]; then
        send_alert "WARNING" "Elevated Error Rate" "Recent errors: $recent_errors"
        return 1
    else
        log "✅ Error Logs: OK (Recent errors: $recent_errors)"
        return 0
    fi
}

# Main monitoring function
main() {
    log "Starting Naqash Thaheem Production Monitoring..."
    
    local total_checks=0
    local failed_checks=0
    local critical_checks=0
    
    # Run all checks
    check_api_health
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_comprehensive_health
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_database_health
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_storage_health
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_disk_space
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_memory_usage
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_php_fpm
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_nginx
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_postgresql
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    check_error_logs
    ((total_checks++))
    if [ $? -gt 0 ]; then ((failed_checks++)); fi
    if [ $? -eq 2 ]; then ((critical_checks++)); fi
    
    # Summary
    log "Monitoring Summary: $total_checks checks, $failed_checks failed, $critical_checks critical"
    
    if [ "$critical_checks" -gt 0 ]; then
        log "🚨 CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED"
        exit 2
    elif [ "$failed_checks" -gt 0 ]; then
        log "⚠️  WARNING ISSUES DETECTED - MONITOR CLOSELY"
        exit 1
    else
        log "✅ All systems operational"
        exit 0
    fi
}

# Run main function
main "$@"
