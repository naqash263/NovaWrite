<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\GoogleAuthController;

Route::get('/', function () {
    return view('welcome');
});

// Google OAuth callback route for web - redirect to API route
Route::get('/auth/google/callback', function (Request $request) {
    $code = $request->input('code');
    $state = $request->input('state');
    $error = $request->input('error');
    
    if ($error) {
        return redirect('http://localhost:3000/login?error=' . urlencode($error));
    }
    
    if (!$code) {
        return redirect('http://localhost:3000/login?error=no_code');
    }
    
    // Redirect to API route with parameters
    $apiUrl = 'http://localhost:8001/api/auth/google/callback?' . http_build_query([
        'code' => $code,
        'state' => $state
    ]);
    
    return redirect($apiUrl);
});

// Serve ads.txt dynamically for Google AdSense verification
// This must be at the root domain: https://naqashthaheem.com/ads.txt
Route::get('/ads.txt', [App\Http\Controllers\Api\Admin\AdSenseSettingsController::class, 'serveAdsTxt']);
