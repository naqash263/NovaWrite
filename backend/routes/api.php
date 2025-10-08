<?php

use Illuminate\Http\Request;

// Health check endpoint (no authentication required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'version' => '1.0.0',
        'environment' => app()->environment(),
    ]);
});

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
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\SmtpConfigurationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('resend-verification', [AuthController::class, 'resendVerification']);
    
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

Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{id}', [PostController::class, 'show']);
Route::get('admin/posts', [PostController::class, 'allPosts'])->middleware('api.auth');
Route::middleware('api.auth')->group(function () {
    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);
});

Route::get('files/{id}/download', [FileController::class, 'download']);
Route::middleware('api.auth')->group(function () {
    Route::get('files', [FileController::class, 'index']);
    Route::get('files/type/{type}', [FileController::class, 'getByType']);
    Route::post('files', [FileController::class, 'store']);
    Route::get('files/{id}', [FileController::class, 'show']);
    Route::put('files/{id}', [FileController::class, 'update']);
    Route::delete('files/{id}', [FileController::class, 'destroy']);
});

Route::get('workflow-categories', [WorkflowController::class, 'categories']);
Route::get('workflows', [WorkflowController::class, 'index']);
Route::get('workflows/{slug}', [WorkflowController::class, 'show']);

Route::post('workflow-downloads', [WorkflowDownloadController::class, 'requestDownload'])->middleware('auth:api');
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

Route::middleware(['api.auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('courses', [CourseController::class, 'adminIndex']);
    Route::post('courses', [CourseController::class, 'store']);
    Route::put('courses/{id}', [CourseController::class, 'update']);
    Route::delete('courses/{id}', [CourseController::class, 'destroy']);

    Route::get('courses/{courseId}/lessons', [LessonController::class, 'index']);
    Route::post('courses/{courseId}/lessons', [LessonController::class, 'store']);
    Route::put('courses/{courseId}/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('courses/{courseId}/lessons/{id}', [LessonController::class, 'destroy']);

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
    
    Route::get('workflows', [AdminWorkflowController::class, 'index']);
    Route::post('workflows', [AdminWorkflowController::class, 'store']);
    Route::get('workflows/{id}', [AdminWorkflowController::class, 'show']);
    Route::put('workflows/{id}', [AdminWorkflowController::class, 'update']);
    Route::delete('workflows/{id}', [AdminWorkflowController::class, 'destroy']);
    Route::post('workflows/{id}/files', [AdminWorkflowController::class, 'attachFile']);
    Route::delete('workflows/{id}/files/{fileId}', [AdminWorkflowController::class, 'detachFile']);
    
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
    
    // Content approval routes
    Route::get('approval/posts/pending', [ContentApprovalController::class, 'getPendingPosts']);
    Route::get('approval/workflows/pending', [ContentApprovalController::class, 'getPendingWorkflows']);
    Route::post('approval/posts/{id}/approve', [ContentApprovalController::class, 'approvePost']);
    Route::post('approval/posts/{id}/reject', [ContentApprovalController::class, 'rejectPost']);
    Route::post('approval/workflows/{id}/approve', [ContentApprovalController::class, 'approveWorkflow']);
    Route::post('approval/workflows/{id}/reject', [ContentApprovalController::class, 'rejectWorkflow']);
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
    
    // Email template management
    Route::apiResource('email-templates', EmailTemplateController::class);
    Route::get('email-templates/{id}/preview', [EmailTemplateController::class, 'preview']);
    Route::post('email-templates/{id}/test', [EmailTemplateController::class, 'test']);
    Route::post('email-templates/{id}/duplicate', [EmailTemplateController::class, 'duplicate']);
    Route::post('email-templates/{id}/toggle-status', [EmailTemplateController::class, 'toggleStatus']);
    Route::get('email-templates/categories', [EmailTemplateController::class, 'categories']);
    Route::get('email-templates/types', [EmailTemplateController::class, 'types']);
    Route::get('email-templates/by-name/{name}', [EmailTemplateController::class, 'getByName']);
    
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
});

