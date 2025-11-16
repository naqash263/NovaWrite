<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('groups:id,name,color'); // Include user groups

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,user',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return response()->json($user, 201);
    }

    public function show($id)
    {
        $user = User::with('groups:id,name,color')->findOrFail($id); // Include user groups
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,user',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
        ];

        // Handle password update - User model has 'password' => 'hashed' cast, so we don't need to hash manually
        if ($request->filled('password') && !empty(trim($request->password))) {
            $updateData['password'] = $request->password; // Model will auto-hash via cast
        }

        $user->update($updateData);

        return response()->json($user->load('groups:id,name,color')); // Include user groups
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting the current user
        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function stats()
    {
        $total = User::count();
        $admins = User::where('role', 'admin')->count();
        $users = User::where('role', 'user')->count();
        $recent = User::where('created_at', '>=', Carbon::now()->subDays(7))->count();

        return response()->json([
            'total' => $total,
            'admins' => $admins,
            'users' => $users,
            'recent' => $recent,
        ]);
    }
}