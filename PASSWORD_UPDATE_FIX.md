# Password Update Fix - Double Hashing Issue

## Problem
When admin updated a user's password, the user couldn't log in because the password was being **double-hashed**:
1. First hash: `Hash::make()` in the controller
2. Second hash: `'password' => 'hashed'` cast in the User model

This made passwords unusable for login.

## Root Cause
The `User` model has a `'password' => 'hashed'` cast (Laravel 9+ feature) that automatically hashes plain text passwords. However, the controllers were also manually hashing passwords with `Hash::make()`, causing double hashing.

## Fix Applied

### Files Changed:
1. **`backend/app/Http/Controllers/Admin/UserManagementController.php`**
   - Removed `Hash::make()` from password update
   - Let the model's `'hashed'` cast handle password hashing automatically

2. **`backend/app/Http/Controllers/Api/Admin/UserController.php`**
   - Removed `Hash::make()` from password update
   - Added empty string check for better validation
   - Let the model's `'hashed'` cast handle password hashing automatically

### Code Changes:

**Before:**
```php
if ($request->has('password') && $request->password) {
    $updateData['password'] = Hash::make($request->password);
}
```

**After:**
```php
// Handle password update - only update if password is provided and not empty
// Note: User model has 'password' => 'hashed' cast, so we don't need to hash manually
if ($request->filled('password') && !empty(trim($request->password))) {
    $updateData['password'] = $request->password; // Model will auto-hash via cast
}
```

## How It Works Now

1. Admin updates user password in admin panel
2. Controller receives plain text password
3. Controller sets `$updateData['password'] = $request->password` (plain text)
4. User model's `'hashed'` cast automatically hashes the password when saving
5. Password is stored correctly (single hash)
6. User can log in with the new password ✅

## Testing

After deployment:
1. Admin updates a user's password (e.g., "waiter" user)
2. User tries to log in with the new password
3. Login should work correctly ✅

## Important Notes

- The `'hashed'` cast in Laravel automatically detects if a password is already hashed and won't hash it again
- This fix ensures passwords are only hashed once (by the model cast)
- Empty password strings are now properly validated with `!empty(trim($request->password))`
- The `filled()` method is more reliable than `has()` for checking if a value exists

## Related Files

- `backend/app/Models/User.php` - Contains `'password' => 'hashed'` cast
- `backend/app/Http/Controllers/Api/AuthController.php` - Login verification (uses Laravel's built-in password checking)

---

**Last Updated**: November 3, 2025

