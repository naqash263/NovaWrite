# Contact Form Email Flow - Complete Reference

## Overview
This document explains the complete flow from when a user submits the contact form to when an email is sent via N8n.

## Flow Steps

### Step 1: User Submits Form (Frontend)
**File:** `frontend/src/pages/Home.tsx`

```typescript
const handleContactSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateContactForm()) {
    return;
  }

  try {
    await apiClient.post('/contact', contactForm);
    // Success handling
  } catch (error: any) {
    // Error handling
  }
};
```

- Uses `apiClient` from `frontend/src/api/axios.ts`
- POST request to `/api/contact`
- Sends: `{ name, email, subject, message }`

### Step 2: API Route
**File:** `backend/routes/api.php`

```php
Route::post('contact', [ContactController::class, 'submit']);
```

- Routes POST request to `ContactController::submit()`

### Step 3: ContactController Validates & Calls EmailService
**File:** `backend/app/Http/Controllers/Api/ContactController.php`

```php
public function submit(Request $request)
{
    // Validate input
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'subject' => 'required|string|max:255',
        'message' => 'required|string|min:10|max:2000',
    ]);

    $data = $validator->validated();

    // Get EmailService and send email
    $emailService = app(EmailService::class);
    $success = $emailService->sendTemplateEmail(
        'contact_form', 
        $variables, 
        'naqash263@gmail.com', 
        'Admin'
    );
    
    return response()->json(['message' => 'Thank you!', 'success' => true]);
}
```

- Validates request data
- Calls `EmailService::sendTemplateEmail()`
- Returns JSON response

### Step 4: EmailService Creates Queue Entry
**File:** `backend/app/Services/EmailService.php`

```php
public function sendTemplateEmail(string $templateName, array $variables, string $to, ?string $toName = null): bool
{
    $config = N8nConfiguration::getActive();
    
    if (!$config) {
        Log::error("No active N8n configuration found");
        return false;
    }

    // Create email queue entry
    $emailQueue = EmailQueue::create([
        'action' => $templateName,
        'recipient_email' => $to,
        'recipient_name' => $toName,
        'details' => $variables,
        'max_attempts' => $config->max_retry_attempts,
        'status' => 'pending'
    ]);

    // Dispatch job to send email
    SendN8nEmail::dispatch($emailQueue);

    Log::info("Email queued successfully");
    return true;
}
```

**What happens:**
1. Gets active N8n configuration from database
2. Creates entry in `email_queue` table
3. Dispatches `SendN8nEmail` job to Laravel queue (`jobs` table)
4. Returns `true` (email is queued, not sent yet)

### Step 5: Queue Worker Processes Job
**Process:** `php artisan queue:work`

When the queue worker processes `SendN8nEmail` job:

**File:** `backend/app/Jobs/SendN8nEmail.php`

```php
public function handle(N8nEmailService $n8nService): void
{
    // Mark as processing
    $this->emailQueue->markAsProcessing();

    // Send to N8n
    $success = $n8nService->sendToN8n(
        $this->emailQueue->action,
        $recipient,
        $this->emailQueue->details
    );

    if ($success) {
        $this->emailQueue->markAsCompleted();
    } else {
        $this->emailQueue->incrementAttempts();
    }
}
```

- Calls `N8nEmailService::sendToN8n()`
- Updates `email_queue` status
- Retries on failure

### Step 6: N8nEmailService Sends HTTP Request to N8n
**File:** `backend/app/Services/N8nEmailService.php`

```php
public function sendToN8n(string $action, array $recipient, array $details): bool
{
    $config = N8nConfiguration::getActive();
    
    $payload = [
        'action' => $action,
        'recipient' => $recipient,
        'details' => $details
    ];

    // Send HTTP POST to N8n webhook
    $response = $this->client->post($config->webhook_url, [
        'json' => $payload,
        'timeout' => $config->webhook_timeout,
        'headers' => [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ]
    ]);

    // Log to email_logs table
    EmailLog::create([
        'action' => $action,
        'recipient_email' => $recipient['email'],
        'status' => 'success',
        'payload' => $payload,
        'response' => json_decode($responseBody, true)
    ]);

    return $statusCode >= 200 && $statusCode < 300;
}
```

**What happens:**
1. Gets active N8n configuration
2. Builds payload with action, recipient, details
3. Sends HTTP POST to N8n webhook URL
4. Logs attempt to `email_logs` table
5. Returns success/failure

### Step 7: N8n Receives Request & Sends Email
- N8n workflow receives the HTTP request
- Reads the action name (`contact_form`)
- Sends email using SMTP configured in N8n

## Database Tables

### 1. `n8n_configurations`
Stores N8n webhook URL and settings.

```sql
SELECT * FROM n8n_configurations WHERE is_active = true;
```

### 2. `email_queue`
Stores emails that need to be sent.

```sql
SELECT * FROM email_queue ORDER BY created_at DESC;
```

### 3. `jobs`
Stores Laravel queue jobs.

```sql
SELECT * FROM jobs;
```

### 4. `email_logs`
Stores all email sending attempts.

```sql
SELECT * FROM email_logs ORDER BY created_at DESC;
```

## Troubleshooting

### Check if Queue Worker is Running
```bash
ps aux | grep "queue:work"
```

### Check Email Queue Status
```bash
# SSH to production
cd ~/naqashthaheem.com/backend

# Check pending emails
php artisan tinker
>>> \DB::table('email_queue')->where('status', 'pending')->count();

# Check jobs table
>>> \DB::table('jobs')->count();
```

### Manual Queue Processing (One-time)
```bash
php artisan queue:work --once
```

### Start Queue Worker Manually (Production)
```bash
cd ~/naqashthaheem.com/backend
nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --timeout=120 > storage/logs/queue-worker.log 2>&1 &
nohup php artisan schedule:work > storage/logs/scheduler.log 2>&1 &
```

### Check Logs
```bash
# Laravel logs
tail -50 storage/logs/laravel.log | grep -i "contact\|email\|n8n"

# Queue worker logs
tail -50 storage/logs/queue-worker.log
```

## Summary

1. **User submits form** → Frontend sends POST to `/api/contact`
2. **ContactController validates** → Calls `EmailService::sendTemplateEmail()`
3. **EmailService creates queue entry** → Inserts into `email_queue` table
4. **EmailService dispatches job** → Inserts into `jobs` table
5. **Queue worker processes job** → Calls `N8nEmailService::sendToN8n()`
6. **N8nEmailService sends HTTP request** → POST to N8n webhook URL
7. **N8n sends email** → Via configured SMTP

**Critical Requirement:** Queue worker MUST be running for step 5 to execute. Without it, emails remain in the queue and are never sent.

