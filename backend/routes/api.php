<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\WorkflowDownloadController;
use App\Http\Controllers\Api\Admin\WorkflowCategoryController as AdminWorkflowCategoryController;
use App\Http\Controllers\Api\Admin\WorkflowController as AdminWorkflowController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{id}', [CategoryController::class, 'show']);
Route::middleware('auth:api')->group(function () {
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
});

Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{id}', [PostController::class, 'show']);
Route::get('admin/posts', [PostController::class, 'allPosts'])->middleware('auth:api');
Route::middleware('auth:api')->group(function () {
    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);
});

Route::get('files/{id}/download', [FileController::class, 'download']);
Route::middleware('auth:api')->group(function () {
    Route::get('files', [FileController::class, 'index']);
    Route::post('files', [FileController::class, 'store']);
    Route::get('files/{id}', [FileController::class, 'show']);
    Route::delete('files/{id}', [FileController::class, 'destroy']);
});

Route::get('workflow-categories', [WorkflowController::class, 'categories']);
Route::get('workflows', [WorkflowController::class, 'index']);
Route::get('workflows/{slug}', [WorkflowController::class, 'show']);

Route::post('workflow-downloads', [WorkflowDownloadController::class, 'requestDownload']);
Route::get('workflow-files/{id}/download', [WorkflowDownloadController::class, 'download'])->name('workflow-files.download');

Route::get('courses', [CourseController::class, 'index']);
Route::get('courses/{slug}', [CourseController::class, 'show']);
Route::middleware('auth:api')->group(function () {
    Route::post('courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::get('my-courses', [CourseController::class, 'myCourses']);
});

Route::middleware('auth:api')->prefix('admin')->group(function () {
    Route::get('courses', [CourseController::class, 'adminIndex']);
    Route::post('courses', [CourseController::class, 'store']);
    Route::put('courses/{id}', [CourseController::class, 'update']);
    Route::delete('courses/{id}', [CourseController::class, 'destroy']);

    Route::get('courses/{courseId}/lessons', [LessonController::class, 'index']);
    Route::post('courses/{courseId}/lessons', [LessonController::class, 'store']);
    Route::put('courses/{courseId}/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('courses/{courseId}/lessons/{id}', [LessonController::class, 'destroy']);

    Route::get('workflow-categories', [AdminWorkflowCategoryController::class, 'index']);
    Route::post('workflow-categories', [AdminWorkflowCategoryController::class, 'store']);
    Route::get('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'show']);
    Route::put('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'update']);
    Route::delete('workflow-categories/{id}', [AdminWorkflowCategoryController::class, 'destroy']);

    Route::get('workflows', [AdminWorkflowController::class, 'index']);
    Route::post('workflows', [AdminWorkflowController::class, 'store']);
    Route::get('workflows/{id}', [AdminWorkflowController::class, 'show']);
    Route::put('workflows/{id}', [AdminWorkflowController::class, 'update']);
    Route::delete('workflows/{id}', [AdminWorkflowController::class, 'destroy']);
    Route::post('workflows/{id}/files', [AdminWorkflowController::class, 'attachFile']);
    Route::delete('workflows/{id}/files/{fileId}', [AdminWorkflowController::class, 'detachFile']);
});
