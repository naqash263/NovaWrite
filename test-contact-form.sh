#!/bin/bash

echo "=== Contact Form Email Flow Test ==="
echo ""

# Test API endpoint
echo "1. Testing Contact Form API..."
curl -X POST https://naqashthaheem.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Contact Form",
    "message": "This is a test message to verify the contact form is working."
  }' | jq .

echo ""
echo "2. Check the following on production server:"
echo ""
echo "  A. Check N8n Configuration:"
echo "     - SSH to production"
echo "     - Run: PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem -c \"SELECT * FROM n8n_configurations WHERE is_active = true;\""
echo ""
echo "  B. Check Email Queue:"
echo "     - PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem -c \"SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;\""
echo ""
echo "  C. Check Laravel Jobs:"
echo "     - PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem -c \"SELECT * FROM jobs;\""
echo ""
echo "  D. Check Email Logs:"
echo "     - PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem -c \"SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;\""
echo ""
echo "  E. Check Queue Worker:"
echo "     - ps aux | grep queue:work"
echo ""
echo "  F. Check Laravel Logs:"
echo "     - tail -50 storage/logs/laravel.log | grep -i 'contact\|email\|n8n'"

