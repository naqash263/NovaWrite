<?php

use Illuminate\Http\Request;

// Include debug routes
require_once __DIR__ . '/debug.php';

// Health check endpoints (no authentication required)
Route::get('/health', [App\Http\Controllers\Api\HealthController::class, 'basic']);
Route::get('/health/comprehensive', [App\Http\Controllers\Api\HealthController::class, 'comprehensive']);
Route::get('/health/database', [App\Http\Controllers\Api\HealthController::class, 'database']);
Route::get('/health/storage', [App\Http\Controllers\Api\HealthController::class, 'storage']);
Route::get('/health/queue', [App\Http\Controllers\Api\QueueHealthController::class, 'check']);

// Storage file serving (no authentication required)
Route::get('/storage/{path}', [App\Http\Controllers\Api\FileController::class, 'serve'])->where('path', '.*');

// Push notification routes
Route::middleware(\App\Http\Middleware\ApiAuth::class)->group(function () {
    Route::post('/push/subscribe', [App\Http\Controllers\PushNotificationController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [App\Http\Controllers\PushNotificationController::class, 'unsubscribe']);
    Route::put('/push/preferences', [App\Http\Controllers\PushNotificationController::class, 'updatePreferences']);
    Route::get('/push/status', [App\Http\Controllers\PushNotificationController::class, 'status']);
});

// Admin push notification routes
Route::middleware([\App\Http\Middleware\ApiAuth::class, 'admin'])->prefix('admin/push-notifications')->group(function () {
    Route::post('/send', [App\Http\Controllers\PushNotificationController::class, 'send']);
    Route::post('/test', [App\Http\Controllers\PushNotificationController::class, 'sendTest']);
    Route::get('/stats', [App\Http\Controllers\PushNotificationController::class, 'getStatistics']);
});

// Career tool notification routes
Route::middleware([\App\Http\Middleware\ApiAuth::class, 'admin'])->prefix('admin/career-tools')->group(function () {
    Route::post('/trigger-update', [App\Http\Controllers\Api\CareerToolController::class, 'triggerUpdate']);
});

// LinkedIn profile extraction routes (public access)
Route::prefix('linkedin')->group(function () {
    Route::post('/extract-profile', [App\Http\Controllers\Api\LinkedInProfileController::class, 'extractProfile']);
    Route::post('/validate-url', [App\Http\Controllers\Api\LinkedInProfileController::class, 'validateUrl']);
});

// Career tools AI routes (public access - authentication optional)
Route::prefix('career-tools')->group(function () {
    Route::post('/linkedin/analyze', [App\Http\Controllers\Api\CareerToolsController::class, 'analyzeLinkedIn']);
    Route::post('/cover-letter/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateCoverLetter']);
    Route::post('/interview-prep/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateInterviewPrep']);
    Route::post('/salary-negotiation/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateSalaryNegotiation']);
    Route::post('/skills-assessment/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateSkillsAssessment']);
    Route::post('/career-path/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateCareerPath']);
    Route::post('/job-search/generate', [App\Http\Controllers\Api\CareerToolsController::class, 'generateJobSearchStrategy']);
});

// AI-powered utility tools (public access - authentication optional)
Route::prefix('ai-tools')->group(function () {
    Route::post('/text-summarizer/summarize', [App\Http\Controllers\Api\TextSummarizerController::class, 'summarize']);
    Route::post('/article-rewriter/rewrite', [App\Http\Controllers\Api\ArticleRewriterController::class, 'rewrite']);
    Route::post('/grammar-checker/check', [App\Http\Controllers\Api\GrammarCheckerController::class, 'check']);
    Route::post('/language-translator/translate', [App\Http\Controllers\Api\LanguageTranslatorController::class, 'translate']);
});

// Image Resizer API routes (public access)
Route::prefix('utility-tools')->group(function () {
    Route::post('/image-resizer/resize', [App\Http\Controllers\Api\ImageResizerController::class, 'resize']);
    Route::get('/image-resizer/presets', [App\Http\Controllers\Api\ImageResizerController::class, 'presets']);
    Route::post('/text-to-image/generate', [App\Http\Controllers\Api\TextToImageController::class, 'generate']);
});

// App analytics routes
Route::middleware(\App\Http\Middleware\ApiAuth::class)->prefix('analytics')->group(function () {
    Route::post('/track/install', [App\Http\Controllers\Api\AppAnalyticsController::class, 'trackInstall']);
    Route::post('/track/uninstall', [App\Http\Controllers\Api\AppAnalyticsController::class, 'trackUninstall']);
    Route::post('/track/launch', [App\Http\Controllers\Api\AppAnalyticsController::class, 'trackLaunch']);
    Route::post('/track/background', [App\Http\Controllers\Api\AppAnalyticsController::class, 'trackBackground']);
});

// Admin analytics routes
Route::middleware([\App\Http\Middleware\ApiAuth::class, 'admin'])->prefix('admin/analytics')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Api\AppAnalyticsController::class, 'getDashboard']);
    Route::get('/summary', [App\Http\Controllers\Api\AppAnalyticsController::class, 'getSummary']);
    Route::get('/retention', [App\Http\Controllers\Api\AppAnalyticsController::class, 'getRetention']);
});

// Email template routes (admin only)
Route::middleware([\App\Http\Middleware\ApiAuth::class, 'admin'])->prefix('admin/email-templates')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\EmailTemplateController::class, 'index']);
    Route::post('/', [App\Http\Controllers\Api\EmailTemplateController::class, 'store']);
    Route::get('/statistics', [App\Http\Controllers\Api\EmailTemplateController::class, 'statistics']);
    Route::get('/{emailTemplate}', [App\Http\Controllers\Api\EmailTemplateController::class, 'show']);
    Route::put('/{emailTemplate}', [App\Http\Controllers\Api\EmailTemplateController::class, 'update']);
    Route::delete('/{emailTemplate}', [App\Http\Controllers\Api\EmailTemplateController::class, 'destroy']);
    Route::get('/{emailTemplate}/preview', [App\Http\Controllers\Api\EmailTemplateController::class, 'preview']);
    Route::post('/{emailTemplate}/test', [App\Http\Controllers\Api\EmailTemplateController::class, 'test']);
    Route::post('/{emailTemplate}/duplicate', [App\Http\Controllers\Api\EmailTemplateController::class, 'duplicate']);
    Route::patch('/{emailTemplate}/toggle-active', [App\Http\Controllers\Api\EmailTemplateController::class, 'toggleActive']);
});

// Public email template routes (for rendering)
Route::prefix('email-templates')->group(function () {
    Route::get('/by-name', [App\Http\Controllers\Api\EmailTemplateController::class, 'getByName']);
    Route::post('/render', [App\Http\Controllers\Api\EmailTemplateController::class, 'render']);
});

// Email sending routes
Route::prefix('email')->group(function () {
    Route::post('/send-template', [App\Http\Controllers\Api\EmailController::class, 'sendTemplateEmail']);
    Route::get('/templates', [App\Http\Controllers\Api\EmailController::class, 'getAvailableTemplates']);
    Route::post('/preview', [App\Http\Controllers\Api\EmailController::class, 'previewTemplate']);
    Route::post('/send-welcome', [App\Http\Controllers\Api\EmailController::class, 'sendWelcomeEmail']);
});

// Email service routes (admin only)
Route::middleware([\App\Http\Middleware\ApiAuth::class, 'admin'])->prefix('email-service')->group(function () {
    Route::post('/send-real-data', [App\Http\Controllers\Api\EmailServiceController::class, 'sendEmailWithRealData']);
    Route::post('/preview-real-data', [App\Http\Controllers\Api\EmailServiceController::class, 'previewEmailWithRealData']);
    Route::get('/available-data', [App\Http\Controllers\Api\EmailServiceController::class, 'getAvailableData']);
    Route::get('/template-variables', [App\Http\Controllers\Api\EmailServiceController::class, 'getTemplateVariables']);
});

    // Test authentication endpoint
    Route::get('/test-auth', function () {
        $user = Auth::user();
        return response()->json([
            'authenticated' => Auth::check(),
            'user_id' => $user ? $user->id : null,
            'user_email' => $user ? $user->email : null
        ]);
    })->middleware('api.auth');
    
    // Get current user endpoint
    Route::get('/auth/me', function () {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated'
            ], 401);
        }
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
            'email_verified_at' => $user->email_verified_at,
            'google_id' => $user->google_id
        ]);
    })->middleware('api.auth');

// Alert endpoints (no authentication required for critical alerts)
Route::post('/alerts/critical', [App\Http\Controllers\Api\AlertController::class, 'sendCriticalAlert']);
Route::get('/alerts/recent', [App\Http\Controllers\Api\AlertController::class, 'getRecentAlerts']);
Route::get('/alerts/stats', [App\Http\Controllers\Api\AlertController::class, 'getAlertStats']);
Route::post('/alerts/test', [App\Http\Controllers\Api\AlertController::class, 'testAlert']);

// Watermark Remover API (public with rate limiting) - moved to top for testing
Route::prefix('watermark-remover')->group(function () {
    Route::get('test', function () {
        return response()->json(['message' => 'Watermark remover API is working']);
    });
    Route::post('upload', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'upload']);
    Route::post('process/{jobId}', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'process']);
    Route::get('status/{jobId}', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'status']);
    Route::get('download/{jobId}', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'download']);
    Route::delete('delete/{jobId}', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'delete']);
    
    // Authenticated routes
    Route::middleware('auth:api')->group(function () {
        Route::get('history', [\App\Http\Controllers\Api\WatermarkRemoverController::class, 'history']);
    });
});

// PHP settings check endpoint
Route::get('/php-settings', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'max_file_uploads' => ini_get('max_file_uploads'),
        'file_uploads' => ini_get('file_uploads') ? 'On' : 'Off',
        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'Not set',
    ]);
});

// Test CV template creation without middleware
Route::post('/test-cv-template', function (Request $request) {
    try {
        $user = \App\Models\User::find(1); // Use admin user directly
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        
        $template = new \App\Models\CvTemplate();
        $template->name = $request->input('name', 'Test Template');
        $template->description = $request->input('description', 'Test description');
        $template->category = $request->input('category', 'general');
        $template->ats_score = $request->input('ats_score', 8);
        $template->html_content = $request->input('html_content', '<div>test</div>');
        $template->json_config = $request->input('json_config', ['layout' => 'single-column']);
        $template->customizable_options = $request->input('customizable_options', []);
        $template->field_mappings = $request->input('field_mappings', []);
        $template->created_by = $user->id;
        $template->save();
        
        return response()->json([
            'success' => true,
            'message' => 'CV template created successfully',
            'data' => $template->load('creator')
        ], 201);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to create template',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test route with middleware
Route::middleware([\App\Http\Middleware\ApiAuth::class, \App\Http\Middleware\AdminMiddleware::class])->post('/test-cv-template-auth', function (Request $request) {
    try {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $template = new \App\Models\CvTemplate();
        $template->name = $request->input('name', 'Test Template Auth');
        $template->description = $request->input('description', 'Test description');
        $template->category = $request->input('category', 'general');
        $template->ats_score = $request->input('ats_score', 8);
        $template->html_content = $request->input('html_content', '<div>test</div>');
        $template->json_config = $request->input('json_config', ['layout' => 'single-column']);
        $template->customizable_options = $request->input('customizable_options', []);
        $template->field_mappings = $request->input('field_mappings', []);
        $template->created_by = $user->id;
        $template->save();
        
        return response()->json([
            'success' => true,
            'message' => 'CV template created successfully with auth',
            'data' => $template->load('creator')
        ], 201);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to create template',
            'error' => $e->getMessage()
        ], 500);
    }
});

// TEMPORARY SOLUTION: Working CV template creation route
Route::post('/admin/cv-templates-temp', function (Request $request) {
    try {
        // Parse JSON strings if they come as strings
        $data = $request->all();
        
        // Handle JSON fields that might come as strings
        if (isset($data['json_config']) && is_string($data['json_config'])) {
            $data['json_config'] = json_decode($data['json_config'], true);
        }
        if (isset($data['customizable_options']) && is_string($data['customizable_options'])) {
            $data['customizable_options'] = json_decode($data['customizable_options'], true);
        }
        if (isset($data['field_mappings']) && is_string($data['field_mappings'])) {
            $data['field_mappings'] = json_decode($data['field_mappings'], true);
        }

        // Validation
        $validator = \Illuminate\Support\Facades\Validator::make($data, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'ats_score' => 'required|integer|min:1|max:10',
            'html_content' => 'required|string',
            'json_config' => 'required|array',
            'customizable_options' => 'nullable|array',
            'field_mappings' => 'nullable|array',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Use admin user (temporary solution)
        $data['created_by'] = 1; // Admin user ID

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $filename = \Illuminate\Support\Str::slug($request->name) . '_' . time() . '.' . $thumbnail->getClientOriginalExtension();
            $path = $thumbnail->storeAs('cv-templates/thumbnails', $filename, 'public');
            $data['thumbnail'] = \Illuminate\Support\Facades\Storage::url($path);
        }

        $template = \App\Models\CvTemplate::create($data);

        return response()->json([
            'success' => true,
            'message' => 'CV template created successfully',
            'data' => $template->load('creator')
        ], 201);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to create template',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Public home settings (no authentication required)
Route::get('/home-settings', [\App\Http\Controllers\Api\Admin\HomeSettingsController::class, 'getPublicSettings']);

// Public AdSense settings (no authentication required - for frontend)
Route::get('/adsense-settings/active', [\App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'getActive']);
Route::get('/adsense-settings/debug', [\App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'debug']);

// Debug endpoint to check JWT configuration
Route::get('/debug/jwt', function () {
    $jwtSecret = config('jwt.secret');
    $jwtAlgo = config('jwt.algo');
    $jwtTtl = config('jwt.ttl');
    
    return response()->json([
        'jwt_secret_set' => !empty($jwtSecret),
        'jwt_secret_length' => strlen($jwtSecret ?? ''),
        'jwt_algo' => $jwtAlgo,
        'jwt_ttl' => $jwtTtl,
        'app_key_set' => !empty(config('app.key')),
        'app_key_length' => strlen(config('app.key') ?? ''),
    ]);
});

// Debug endpoint to check database tables
Route::get('/debug/database', function () {
    try {
        // Test basic database connection
        $connection = \Illuminate\Support\Facades\DB::connection();
        $pdo = $connection->getPdo();
        
        // Get database name
        $databaseName = config('database.connections.pgsql.database');
        
        // Try to get tables
        $tables = \Illuminate\Support\Facades\DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = ?", [$databaseName]);
        $tableNames = array_column($tables, 'table_name');
        
        // Also try a simple query to test connection
        $testQuery = \Illuminate\Support\Facades\DB::select("SELECT 1 as test");
        
        // Check api_tokens table structure if it exists
        $apiTokensStructure = null;
        if (in_array('api_tokens', $tableNames)) {
            $apiTokensStructure = \Illuminate\Support\Facades\DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'api_tokens' ORDER BY ordinal_position");
        }
        
        return response()->json([
            'database' => $databaseName,
            'connection_working' => true,
            'test_query' => $testQuery,
            'tables' => $tableNames,
            'api_tokens_exists' => in_array('api_tokens', $tableNames),
            'api_tokens_structure' => $apiTokensStructure,
            'migrations_table_exists' => in_array('migrations', $tableNames),
            'total_tables' => count($tableNames),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'database' => config('database.connections.pgsql.database'),
            'connection_working' => false,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);
    }
});

// Migration runner endpoint (temporary for fixing missing tables)
Route::post('/debug/run-migrations', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        
        return response()->json([
            'success' => true,
            'output' => $output,
            'message' => 'Migrations completed successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'message' => 'Migration failed'
        ]);
    }
});

// Debug API token creation step by step
Route::post('/debug/api-token-test', function (Request $request) {
    try {
        // Step 1: Test Auth
        $user = \Illuminate\Support\Facades\Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Not authenticated', 'step' => 'auth']);
        }
        
        // Step 2: Test ApiToken model
        $apiTokenModel = new \App\Models\ApiToken();
        
        // Step 3: Test database connection
        $connection = \Illuminate\Support\Facades\DB::connection();
        $pdo = $connection->getPdo();
        
        // Step 4: Test table exists
        $tableExists = \Illuminate\Support\Facades\Schema::hasTable('api_tokens');
        
        // Step 5: Test creating a token
        $testToken = \App\Models\ApiToken::create([
            'name' => 'Debug Test Token',
            'token' => \App\Models\ApiToken::generateToken(),
            'permissions' => ['admin'],
            'expires_at' => null,
            'user_id' => $user->id,
        ]);
        
        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'user_role' => $user->role,
            'table_exists' => $tableExists,
            'connection_working' => true,
            'token_created' => true,
            'token_id' => $testToken->id,
            'step' => 'complete'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
    }
});

// Simplified API token creation for debugging
Route::post('/debug/simple-api-token', function (Request $request) {
    try {
        // Get authenticated user
        $user = \Illuminate\Support\Facades\Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        // Validate input
        $name = $request->input('name', 'Test Token');
        $permissions = $request->input('permissions', ['admin']);
        $expiresInDays = $request->input('expires_in_days', 30);
        
        // Calculate expiration
        $expiresAt = null;
        if ($expiresInDays > 0) {
            $expiresAt = \Carbon\Carbon::now()->addDays($expiresInDays);
        }
        
        // Create token
        $token = \App\Models\ApiToken::create([
            'name' => $name,
            'token' => \App\Models\ApiToken::generateToken(),
            'permissions' => $permissions,
            'expires_at' => $expiresAt,
            'user_id' => $user->id,
        ]);
        
        return response()->json([
            'success' => true,
            'token' => [
                'id' => $token->id,
                'name' => $token->name,
                'token' => $token->token,
                'permissions' => $token->permissions,
                'expires_at' => $token->expires_at,
                'created_at' => $token->created_at,
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);
    }
});

// Admin setup endpoint (temporary for initial setup) - REMOVED FOR SECURITY
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\Admin\HomeSettingsController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\LessonFileController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\WorkflowDownloadController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\Admin\WorkflowCategoryController as AdminWorkflowCategoryController;
use App\Http\Controllers\Api\Admin\WorkflowController as AdminWorkflowController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\BulkOperationsController;
use App\Http\Controllers\Api\Admin\ContentApprovalController;
use App\Http\Controllers\Api\Admin\CacheController;
use App\Http\Controllers\Api\Auth\TwoFactorController;
use App\Http\Controllers\Api\Admin\ActivityLogController;
use App\Http\Controllers\Api\Admin\ApiTokenController;
use App\Http\Controllers\Api\Auth\GoogleAuthController;
use App\Http\Controllers\Api\Admin\UserGroupController;
use App\Http\Controllers\Api\Admin\UserAccessController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\SmtpConfigurationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    
    // Google OAuth routes
    Route::get('google', [\App\Http\Controllers\Api\GoogleAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [\App\Http\Controllers\Api\GoogleAuthController::class, 'handleGoogleCallback']);
    Route::get('google/url', [\App\Http\Controllers\Api\GoogleAuthController::class, 'getGoogleUrl']);
    
    Route::middleware('api.auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
        
        // Two-factor authentication routes
        Route::post('2fa/enable', [TwoFactorController::class, 'enable']);
        Route::post('2fa/verify', [TwoFactorController::class, 'verify']);
        Route::post('2fa/disable', [TwoFactorController::class, 'disable']);
        Route::get('2fa/status', [TwoFactorController::class, 'getStatus']);
        
        // Google OAuth management routes (authenticated)
        Route::post('google/unlink', [GoogleAuthController::class, 'unlinkGoogle']);
        Route::get('google/status', [GoogleAuthController::class, 'getGoogleStatus']);
        Route::post('google/set-password', [GoogleAuthController::class, 'setPassword']);
    });
    
    // 2FA login routes (no auth required)
    Route::post('2fa/verify-login', [TwoFactorController::class, 'verifyLogin']);
    Route::post('2fa/recovery', [TwoFactorController::class, 'useRecoveryCode']);
    
    // Google OAuth routes (no auth required)
    Route::get('google/redirect', [GoogleAuthController::class, 'redirectToGoogle']);
    Route::post('google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
});

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{id}', [CategoryController::class, 'show']);
Route::middleware('api.auth')->group(function () {
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
});

Route::get('tags', [App\Http\Controllers\Api\TagController::class, 'index']);
Route::middleware('api.auth')->group(function () {
    Route::post('tags', [App\Http\Controllers\Api\TagController::class, 'store']);
    Route::get('tags/{id}', [App\Http\Controllers\Api\TagController::class, 'show']);
    Route::put('tags/{id}', [App\Http\Controllers\Api\TagController::class, 'update']);
    Route::delete('tags/{id}', [App\Http\Controllers\Api\TagController::class, 'destroy']);
});

Route::get('posts', [PostController::class, 'index']);
Route::get('posts/latest', [PostController::class, 'latest']);
Route::get('posts/{idOrSlug}', [PostController::class, 'show']);
Route::post('posts/clear-cache', [PostController::class, 'clearCache'])->middleware('api.auth');
Route::get('admin/posts', [PostController::class, 'allPosts'])->middleware('api.auth');
Route::middleware('api.auth')->group(function () {
    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);
});

Route::get('files/{id}/download', [FileController::class, 'download']);

// Public SEO file routes
Route::get('files/search', [FileController::class, 'search']);
Route::get('files/categories', [FileController::class, 'getCategories']);
Route::get('files/purposes', [FileController::class, 'getPurposes']);
Route::get('files/audiences', [FileController::class, 'getAudiences']);
Route::get('files/seo/stats', [FileController::class, 'getSeoStats']);

Route::middleware('api.auth')->group(function () {
    Route::get('files', [FileController::class, 'index']);
    Route::get('files/type/{type}', [FileController::class, 'getByType']);
    Route::post('files', [FileController::class, 'store']);
    Route::get('files/{id}', [FileController::class, 'show']);
    Route::put('files/{id}', [FileController::class, 'update']);
    Route::delete('files/{id}', [FileController::class, 'destroy']);
    Route::post('files/{id}/regenerate-seo', [FileController::class, 'regenerateSeo']);
});

Route::get('workflow-categories', [WorkflowController::class, 'categories']);
Route::get('workflows', [WorkflowController::class, 'index']);
Route::get('workflows/{slug}', [WorkflowController::class, 'show']);

Route::get('projects', [App\Http\Controllers\Api\ProjectController::class, 'index']);
Route::get('projects/{slug}', [App\Http\Controllers\Api\ProjectController::class, 'show']);

Route::post('workflow-downloads', [WorkflowDownloadController::class, 'requestDownload']);
Route::get('workflow-files/{id}/download', [WorkflowDownloadController::class, 'download'])->name('workflow-files.download');

Route::post('contact', [ContactController::class, 'submit']);

Route::get('courses', [CourseController::class, 'index']);
Route::get('courses/{slug}', [CourseController::class, 'show']);
Route::middleware('api.auth')->group(function () {
    Route::post('courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::get('my-courses', [CourseController::class, 'myCourses']);
    
    // Lesson Progress Management
    Route::post('lessons/{lessonId}/complete', [App\Http\Controllers\Api\LessonProgressController::class, 'markCompleted']);
    Route::get('lessons/{lessonId}/progress', [App\Http\Controllers\Api\LessonProgressController::class, 'getProgress']);
    Route::get('courses/{courseId}/progress', [App\Http\Controllers\Api\LessonProgressController::class, 'getCourseProgress']);
    Route::delete('lessons/{lessonId}/progress', [App\Http\Controllers\Api\LessonProgressController::class, 'resetProgress']);
    
    // Lesson Tests
    Route::get('lessons/{lessonId}/test', [App\Http\Controllers\Api\LessonTestController::class, 'getTest']);
    Route::post('lessons/{lessonId}/test/start', [App\Http\Controllers\Api\LessonTestController::class, 'startTest']);
    Route::post('lessons/{lessonId}/test/submit', [App\Http\Controllers\Api\LessonTestController::class, 'submitTest']);
    Route::get('lessons/{lessonId}/test/results', [App\Http\Controllers\Api\LessonTestController::class, 'getResults']);
});

Route::middleware([\App\Http\Middleware\ApiAuth::class, \App\Http\Middleware\AdminMiddleware::class])->prefix('admin')->group(function () {
    // User Activities
    Route::get('user-activities', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'index']);
    Route::get('user-activities/statistics', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'statistics']);
    Route::get('user-activities/types', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'activityTypes']);
    Route::get('user-activities/user/{userId}', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'userActivities']);
    Route::delete('user-activities/cleanup', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'cleanup']);

    Route::get('courses', [CourseController::class, 'adminIndex']);
    Route::post('courses', [CourseController::class, 'store']);
    Route::put('courses/{id}', [CourseController::class, 'update']);
    Route::delete('courses/{id}', [CourseController::class, 'destroy']);

    // Course Files Management
    Route::get('courses/{courseId}/files', [App\Http\Controllers\Api\CourseFileController::class, 'index']);
    Route::post('courses/{courseId}/files', [App\Http\Controllers\Api\CourseFileController::class, 'store']);
    Route::get('courses/{courseId}/files/{id}', [App\Http\Controllers\Api\CourseFileController::class, 'show']);
    Route::put('courses/{courseId}/files/{id}', [App\Http\Controllers\Api\CourseFileController::class, 'update']);
    Route::delete('courses/{courseId}/files/{id}', [App\Http\Controllers\Api\CourseFileController::class, 'destroy']);
    Route::post('courses/{courseId}/files/reorder', [App\Http\Controllers\Api\CourseFileController::class, 'reorder']);

    Route::get('courses/{courseId}/lessons', [LessonController::class, 'index']);
    Route::post('courses/{courseId}/lessons', [LessonController::class, 'store']);
    Route::put('courses/{courseId}/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('courses/{courseId}/lessons/{id}', [LessonController::class, 'destroy']);

    // Lesson Test Management (Admin)
    Route::get('lessons/{lessonId}/tests', [App\Http\Controllers\Api\Admin\LessonTestAdminController::class, 'index']);
    Route::post('lessons/{lessonId}/tests', [App\Http\Controllers\Api\Admin\LessonTestAdminController::class, 'store']);
    Route::get('lessons/{lessonId}/tests/{id}', [App\Http\Controllers\Api\Admin\LessonTestAdminController::class, 'show']);
    Route::put('lessons/{lessonId}/tests/{id}', [App\Http\Controllers\Api\Admin\LessonTestAdminController::class, 'update']);
    Route::delete('lessons/{lessonId}/tests/{id}', [App\Http\Controllers\Api\Admin\LessonTestAdminController::class, 'destroy']);

    // Lesson Files Management
    Route::get('lessons/{lessonId}/files', [LessonFileController::class, 'index']);
    Route::post('lessons/{lessonId}/files', [LessonFileController::class, 'store']);
    Route::get('lessons/{lessonId}/files/{id}', [LessonFileController::class, 'show']);
    Route::put('lessons/{lessonId}/files/{id}', [LessonFileController::class, 'update']);
    Route::delete('lessons/{lessonId}/files/{id}', [LessonFileController::class, 'destroy']);
    Route::post('lessons/{lessonId}/files/reorder', [LessonFileController::class, 'reorder']);

    Route::get('workflow-categories', [AdminWorkflowCategoryController::class, 'index']);
    Route::post('workflow-categories', [AdminWorkflowCategoryController::class, 'store']);
    Route::get('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'show']);
    Route::put('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'update']);
    Route::delete('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'destroy']);

    // Stats endpoints must come before resource routes
    Route::get('posts/stats', [PostController::class, 'stats']);
    Route::get('workflows/stats', [AdminWorkflowController::class, 'stats']);
    
    // Posts admin routes
    Route::get('posts', [PostController::class, 'allPosts']);
    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);
    
    // API Tokens management
    Route::get('api-tokens', [ApiTokenController::class, 'index']);
    Route::post('api-tokens', [ApiTokenController::class, 'store']);
    Route::get('api-tokens/{apiToken}', [ApiTokenController::class, 'show']);
    Route::put('api-tokens/{apiToken}', [ApiTokenController::class, 'update']);
    Route::delete('api-tokens/{apiToken}', [ApiTokenController::class, 'destroy']);
    Route::get('api-tokens-stats', [ApiTokenController::class, 'stats']);
    
    // Home Settings management
    Route::get('home-settings', [HomeSettingsController::class, 'index']);
    Route::post('home-settings', [HomeSettingsController::class, 'store']);
    Route::get('home-settings/{homeSetting}', [HomeSettingsController::class, 'show']);
    Route::put('home-settings/{homeSetting}', [HomeSettingsController::class, 'update']);
    Route::delete('home-settings/{homeSetting}', [HomeSettingsController::class, 'destroy']);
    Route::post('home-settings/upload-image', [HomeSettingsController::class, 'uploadImage']);
    Route::post('home-settings/bulk-update', [HomeSettingsController::class, 'bulkUpdate']);
    Route::post('home-settings/{homeSetting}/toggle-active', [HomeSettingsController::class, 'toggleActive']);

    // AdSense Settings management
    Route::get('adsense-settings', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'index']);
    Route::post('adsense-settings', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'store']);
    Route::put('adsense-settings/{adSenseSetting}', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'update']);
    Route::delete('adsense-settings/{adSenseSetting}', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'destroy']);
    Route::post('adsense-settings/{adSenseSetting}/toggle-active', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'toggleActive']);
    Route::post('adsense-settings/reset', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'reset']);

    Route::get('workflows', [AdminWorkflowController::class, 'index']);
    Route::post('workflows', [AdminWorkflowController::class, 'store']);
    Route::get('workflows/{id}', [AdminWorkflowController::class, 'show']);
    Route::put('workflows/{id}', [AdminWorkflowController::class, 'update']);
    Route::delete('workflows/{id}', [AdminWorkflowController::class, 'destroy']);
    Route::post('workflows/{id}/files', [AdminWorkflowController::class, 'attachFile']);
    Route::delete('workflows/{id}/files/{fileId}', [AdminWorkflowController::class, 'detachFile']);
    
    // Projects Management
    Route::get('projects', [App\Http\Controllers\Api\Admin\ProjectController::class, 'index']);
    Route::post('projects', [App\Http\Controllers\Api\Admin\ProjectController::class, 'store']);
    Route::get('projects/{id}', [App\Http\Controllers\Api\Admin\ProjectController::class, 'show']);
    Route::put('projects/{id}', [App\Http\Controllers\Api\Admin\ProjectController::class, 'update']);
    Route::delete('projects/{id}', [App\Http\Controllers\Api\Admin\ProjectController::class, 'destroy']);
    Route::get('projects/stats', [App\Http\Controllers\Api\Admin\ProjectController::class, 'stats']);
    
    // User management routes
    Route::get('users/stats', [AdminUserController::class, 'stats']);
    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::get('users/{id}', [AdminUserController::class, 'show']);
    Route::put('users/{id}', [AdminUserController::class, 'update']);
    Route::delete('users/{id}', [AdminUserController::class, 'destroy']);
    
    // Bulk operations routes
    Route::post('bulk/posts/delete', [BulkOperationsController::class, 'bulkDeletePosts']);
    Route::post('bulk/posts/status', [BulkOperationsController::class, 'bulkUpdatePostStatus']);
    Route::post('bulk/users/delete', [BulkOperationsController::class, 'bulkDeleteUsers']);
    Route::post('bulk/users/role', [BulkOperationsController::class, 'bulkUpdateUserRole']);
    Route::post('bulk/workflows/delete', [BulkOperationsController::class, 'bulkDeleteWorkflows']);
    Route::post('bulk/workflows/status', [BulkOperationsController::class, 'bulkUpdateWorkflowStatus']);
    
    // Content approval routes (posts only - workflows don't need approval)
    Route::get('approval/posts/pending', [ContentApprovalController::class, 'getPendingPosts']);
    Route::post('approval/posts/{id}/approve', [ContentApprovalController::class, 'approvePost']);
    Route::post('approval/posts/{id}/reject', [ContentApprovalController::class, 'rejectPost']);
    Route::get('approval/stats', [ContentApprovalController::class, 'getApprovalStats']);
    Route::post('approval/bulk/approve', [ContentApprovalController::class, 'bulkApprove']);
    Route::post('approval/bulk/reject', [ContentApprovalController::class, 'bulkReject']);
    
    // Cache management routes
    Route::post('cache/clear', [\App\Http\Controllers\Api\Admin\CacheController::class, 'clearAllCache']);
    Route::post('cache/clear-key', [\App\Http\Controllers\Api\Admin\CacheController::class, 'clearSpecificCache']);
    Route::get('cache/stats', [\App\Http\Controllers\Api\Admin\CacheController::class, 'getCacheStats']);
    Route::post('cache/warm', [\App\Http\Controllers\Api\Admin\CacheController::class, 'warmCache']);
    
    // Activity logging routes
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('activity-logs/{id}', [ActivityLogController::class, 'show']);
    Route::get('activity-logs/stats', [ActivityLogController::class, 'getStats']);
    Route::get('activity-logs/user/{userId}', [ActivityLogController::class, 'getUserActivity']);
    Route::delete('activity-logs/clear', [ActivityLogController::class, 'clear']);
    Route::get('activity-logs/export', [ActivityLogController::class, 'export']);
    
    // User groups management
    Route::get('user-groups/stats', [UserGroupController::class, 'getStats']);
    Route::get('user-groups', [UserGroupController::class, 'index']);
    Route::post('user-groups', [UserGroupController::class, 'store']);
    Route::get('user-groups/{id}', [UserGroupController::class, 'show']);
    Route::put('user-groups/{id}', [UserGroupController::class, 'update']);
    Route::delete('user-groups/{id}', [UserGroupController::class, 'destroy']);
    Route::post('user-groups/{id}/members', [UserGroupController::class, 'addMember']);
    Route::delete('user-groups/{id}/members/{userId}', [UserGroupController::class, 'removeMember']);
    Route::post('user-groups/{id}/bulk-members', [UserGroupController::class, 'bulkAddMembers']);
    
    // User access control
    Route::get('users/{userId}/access', [UserAccessController::class, 'getUserAccess']);
    Route::post('access/grant', [UserAccessController::class, 'grantAccess']);
    Route::put('access/{accessId}', [UserAccessController::class, 'updateAccess']);
    Route::delete('access/{accessId}', [UserAccessController::class, 'revokeAccess']);
    Route::post('access/bulk-grant', [UserAccessController::class, 'bulkGrantAccess']);
    Route::get('resources/access', [UserAccessController::class, 'getResourceAccess']);
    Route::get('access/stats', [UserAccessController::class, 'getAccessStats']);
    
    // User management (manual verification)
    Route::get('user-management', [UserManagementController::class, 'index']);
    Route::get('user-management/stats', [UserManagementController::class, 'statistics']);
    Route::post('user-management/bulk-verify', [UserManagementController::class, 'bulkVerify']);
    Route::get('user-management/{user}', [UserManagementController::class, 'show']);
    Route::put('user-management/{user}', [UserManagementController::class, 'update']);
    Route::delete('user-management/{user}', [UserManagementController::class, 'destroy']);
    Route::post('user-management/{user}/verify', [UserManagementController::class, 'verifyAccount']);
    Route::post('user-management/{user}/unverify', [UserManagementController::class, 'unverifyAccount']);
    Route::post('user-management/{user}/resend-verification', [UserManagementController::class, 'resendVerification']);
    
    // Email management
    Route::post('emails/welcome', [EmailController::class, 'sendWelcomeEmail']);
    Route::post('emails/password-reset', [EmailController::class, 'sendPasswordResetEmail']);
    Route::post('emails/course-enrollment', [EmailController::class, 'sendCourseEnrollmentEmail']);
    Route::post('emails/workflow-notification', [EmailController::class, 'sendWorkflowNotificationEmail']);
    Route::post('emails/bulk', [EmailController::class, 'sendBulkEmails']);
    Route::post('emails/test-configuration', [EmailController::class, 'testEmailConfiguration']);
    Route::get('emails/stats', [EmailController::class, 'getEmailStats']);
    
    
        // SMTP configuration management
        Route::apiResource('smtp-configurations', SmtpConfigurationController::class);
        Route::post('smtp-configurations/{id}/test', [SmtpConfigurationController::class, 'test']);
        Route::post('smtp-configurations/{id}/set-active', [SmtpConfigurationController::class, 'setActive']);
        Route::post('smtp-configurations/{id}/set-default', [SmtpConfigurationController::class, 'setDefault']);
        Route::post('smtp-configurations/{id}/duplicate', [SmtpConfigurationController::class, 'duplicate']);
        Route::get('smtp-configurations/mailer-types', [SmtpConfigurationController::class, 'getMailerTypes']);
        Route::get('smtp-configurations/encryption-types', [SmtpConfigurationController::class, 'getEncryptionTypes']);
        Route::get('smtp-configurations/common-ports', [SmtpConfigurationController::class, 'getCommonPorts']);
        Route::get('smtp-configurations/active', [SmtpConfigurationController::class, 'getActive']);
        Route::get('smtp-configurations/default', [SmtpConfigurationController::class, 'getDefault']);

        // System email settings
        Route::get('system-email-settings', [App\Http\Controllers\Api\SystemEmailSettingsController::class, 'index']);
        Route::post('system-email-settings', [App\Http\Controllers\Api\SystemEmailSettingsController::class, 'store']);
        Route::post('system-email-settings/test', [App\Http\Controllers\Api\SystemEmailSettingsController::class, 'testEmail']);
        Route::get('system-email-settings/health', [App\Http\Controllers\Api\SystemEmailSettingsController::class, 'health']);
    
    // Gemini API Management
    // Specific routes must come BEFORE parameterized routes (apiResource)
    Route::get('gemini-api-keys/available', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'getAvailableKeys']);
    Route::get('gemini-api-keys/comprehensive-stats', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'getComprehensiveStats']);
    Route::get('gemini-api-keys/health-check', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'checkApiKeysHealth']);
    Route::post('gemini-api-keys/reset-limits', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'resetLimits']);
    Route::post('gemini-api-keys/reset-usage', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'resetUsageOnly']);
    Route::post('gemini-api-keys/{id}/test', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'test']);
    Route::apiResource('gemini-api-keys', \App\Http\Controllers\Api\Admin\GeminiApiController::class);
    
    // User API Key Management (Admin only)
    Route::get('user-api-keys', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'getUserApiKeys']);
    Route::put('user-api-keys/{id}/quota', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'updateUserApiKeyQuota']);
    Route::post('user-api-keys/{id}/reset-usage', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'resetUserApiKeyUsage']);
    Route::delete('user-api-keys/{id}', [\App\Http\Controllers\Api\Admin\GeminiApiController::class, 'deleteUserApiKey']);
    
    // CV Template Management
    Route::apiResource('cv-templates', \App\Http\Controllers\Api\Admin\CvTemplateController::class);
    Route::post('cv-templates/upload', [\App\Http\Controllers\Api\Admin\CvTemplateController::class, 'uploadFile']);
    Route::post('cv-templates/{id}/toggle', [\App\Http\Controllers\Api\Admin\CvTemplateController::class, 'toggle']);
    Route::post('cv-templates/{id}/set-default', [\App\Http\Controllers\Api\Admin\CvTemplateController::class, 'setDefault']);
    Route::post('cv-templates/preview', [\App\Http\Controllers\Api\Admin\CvTemplateController::class, 'preview']);
    
    // N8n Configuration Management
    Route::get('n8n-configurations', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'index']);
    Route::post('n8n-configurations', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'store']);
    Route::get('n8n-configurations/{id}', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'show']);
    Route::put('n8n-configurations/{id}', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'update']);
    Route::delete('n8n-configurations/{id}', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'destroy']);
    Route::post('n8n-configurations/{id}/activate', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'activate']);
    Route::post('n8n-configurations/{id}/deactivate', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'deactivate']);
    Route::post('n8n-configurations/{id}/test', [\App\Http\Controllers\Api\Admin\N8nConfigurationController::class, 'test']);
    
    // Email Queue Management
    Route::get('email-queue', [\App\Http\Controllers\Api\Admin\EmailQueueController::class, 'index']);
    Route::get('email-queue/{id}', [\App\Http\Controllers\Api\Admin\EmailQueueController::class, 'show']);
    Route::post('email-queue/{id}/retry', [\App\Http\Controllers\Api\Admin\EmailQueueController::class, 'retry']);
    Route::post('email-queue/retry-all', [\App\Http\Controllers\Api\Admin\EmailQueueController::class, 'retryAll']);
    Route::get('email-queue/stats', [\App\Http\Controllers\Api\Admin\EmailQueueController::class, 'stats']);
    
    // Email Logs Management
    Route::get('email-logs', [\App\Http\Controllers\Api\Admin\EmailLogController::class, 'index']);
    Route::get('email-logs/{id}', [\App\Http\Controllers\Api\Admin\EmailLogController::class, 'show']);
    Route::get('email-logs/stats', [\App\Http\Controllers\Api\Admin\EmailLogController::class, 'stats']);

    // Fallback Webhooks Management
    Route::get('fallback-webhooks', [\App\Http\Controllers\Api\Admin\FallbackWebhookController::class, 'index']);
    Route::post('fallback-webhooks', [\App\Http\Controllers\Api\Admin\FallbackWebhookController::class, 'store']);
    Route::put('fallback-webhooks/{id}', [\App\Http\Controllers\Api\Admin\FallbackWebhookController::class, 'update']);
    Route::delete('fallback-webhooks/{id}', [\App\Http\Controllers\Api\Admin\FallbackWebhookController::class, 'destroy']);

    // Fallback Notifications
    Route::post('fallback-notifications/notify-now', [\App\Http\Controllers\Api\Admin\FallbackNotificationController::class, 'notifyNow']);
    Route::post('fallback-notifications/toggle-auto', [\App\Http\Controllers\Api\Admin\FallbackNotificationController::class, 'toggleAuto']);
});

// User API Key Management (authenticated users only)
Route::middleware('api.auth')->group(function () {
    Route::get('user-api-keys/stats', [\App\Http\Controllers\Api\UserApiKeyController::class, 'stats']);
    Route::apiResource('user-api-keys', \App\Http\Controllers\Api\UserApiKeyController::class)->only(['index', 'store', 'destroy']);
});

// CV AI Routes (public)
Route::prefix('cv-ai')->group(function () {
    Route::post('extract', [\App\Http\Controllers\Api\CvAiController::class, 'extractCv']);
    Route::post('tailor', [\App\Http\Controllers\Api\CvAiController::class, 'tailorCv']);
    Route::get('stats', [\App\Http\Controllers\Api\CvAiController::class, 'getApiStats']);
    Route::post('add-user-key', [\App\Http\Controllers\Api\CvAiController::class, 'addUserApiKey']);
    Route::get('check-encryption', [\App\Http\Controllers\Api\CvAiController::class, 'checkEncryptionConsistency']); // Prevention endpoint
    Route::get('debug-keys', [\App\Http\Controllers\Api\CvAiController::class, 'debugApiKeys']); // Temporary debug endpoint
    Route::get('fix-keys', [\App\Http\Controllers\Api\CvAiController::class, 'fixApiKeys']); // Temporary fix endpoint
    Route::post('create-temp-key', [\App\Http\Controllers\Api\CvAiController::class, 'createTempApiKey']); // Emergency fix endpoint
});

// Public CV Template API
Route::get('cv-templates', [\App\Http\Controllers\Api\CvTemplateController::class, 'index']);
Route::get('cv-templates/categories', [\App\Http\Controllers\Api\CvTemplateController::class, 'categories']);
Route::get('cv-templates/default', [\App\Http\Controllers\Api\CvTemplateController::class, 'default']);
Route::get('cv-templates/{cvTemplate}', [\App\Http\Controllers\Api\CvTemplateController::class, 'show']);
Route::post('cv-templates/customize', [\App\Http\Controllers\Api\CvTemplateController::class, 'customize']);

// Dynamic sitemap - accessible via /api/sitemap-ntw2024.xml
Route::get('sitemap-ntw2024.xml', [\App\Http\Controllers\Api\SitemapController::class, 'index']);


