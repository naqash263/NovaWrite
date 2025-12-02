<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IssueCategory;
use Illuminate\Http\JsonResponse;

class IssueCategoryController extends Controller
{
    /**
     * List all active issue categories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = IssueCategory::active()->ordered()->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories'
            ], 500);
        }
    }
}
