<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Controllers read the authenticated user through the default guard (auth()->id(),
 * Auth::user(), $request->user()). ApiAuth must make 'api' the default guard, otherwise
 * those calls return null when AUTH_GUARD is left at 'web' and checks such as
 * "you cannot delete your own account" silently stop working.
 */
class ApiAuthGuardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'auth.defaults.guard' => 'web', 'jwt.secret' => str_repeat('t', 64)]);

        // The project's migrations target PostgreSQL, so build just the tables this test needs.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('user');
            $table->timestamps();
        });
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('name');
            $table->string('token', 80)->unique();
            $table->json('permissions')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Route::middleware('api.auth')->get('/_test/whoami', fn () => response()->json([
            'auth_id' => auth()->id(),
            'facade_id' => Auth::id(),
            'request_user_id' => request()->user()?->id,
        ]));
    }

    public function test_api_token_user_is_visible_through_the_default_guard(): void
    {
        $user = User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'secret-password', 'role' => 'admin']);
        $token = ApiToken::generateToken();
        ApiToken::create(['user_id' => $user->id, 'name' => 'test', 'token' => $token]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/_test/whoami')
            ->assertOk()
            ->assertExactJson(['auth_id' => $user->id, 'facade_id' => $user->id, 'request_user_id' => $user->id]);
    }

    public function test_requests_without_a_token_are_rejected(): void
    {
        $this->getJson('/_test/whoami')->assertStatus(401);
    }
}
