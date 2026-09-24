<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** An admin must not be able to delete or demote their own account through the API. */
class AdminSelfProtectionTest extends TestCase
{
    private User $admin;

    private User $other;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'auth.defaults.guard' => 'web', 'jwt.secret' => str_repeat('t', 64)]);
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('user');
            $table->timestamp('email_verified_at')->nullable();
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
        $this->admin = User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'secret-password', 'role' => 'admin']);
        $this->other = User::create(['name' => 'Member', 'email' => 'member@example.com', 'password' => 'secret-password', 'role' => 'user']);
        $this->token = ApiToken::generateToken();
        ApiToken::create(['user_id' => $this->admin->id, 'name' => 'test', 'token' => $this->token]);
    }

    private function asAdmin(): self
    {
        return $this->withHeader('Authorization', "Bearer {$this->token}");
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $this->asAdmin()->putJson("/api/admin/user-management/{$this->admin->id}", ['role' => 'user'])->assertStatus(422);
        $this->assertSame('admin', $this->admin->fresh()->role);
    }

    public function test_admin_can_still_edit_own_name_and_other_users_roles(): void
    {
        $this->asAdmin()->putJson("/api/admin/user-management/{$this->admin->id}", ['name' => 'Renamed', 'role' => 'admin'])->assertOk();
        $this->asAdmin()->putJson("/api/admin/user-management/{$this->other->id}", ['role' => 'admin'])->assertOk();
        $this->assertSame('admin', $this->other->fresh()->role);
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $this->asAdmin()->deleteJson("/api/admin/user-management/{$this->admin->id}")->assertStatus(400);
        $this->assertNotNull($this->admin->fresh());
    }

    public function test_bulk_actions_skip_the_requesting_admin(): void
    {
        $this->asAdmin()->postJson('/api/admin/bulk/users/role', ['ids' => [$this->admin->id, $this->other->id], 'role' => 'user'])->assertOk();
        $this->assertSame('admin', $this->admin->fresh()->role);

        $this->asAdmin()->postJson('/api/admin/bulk/users/role', ['ids' => [$this->admin->id], 'role' => 'user'])->assertStatus(422);

        $this->asAdmin()->postJson('/api/admin/bulk/users/delete', ['ids' => [$this->admin->id]])->assertStatus(403);
        $this->asAdmin()->postJson('/api/admin/bulk/users/delete', ['ids' => [$this->admin->id, $this->other->id]])->assertOk();
        $this->assertNotNull($this->admin->fresh());
        $this->assertNull($this->other->fresh());
    }
}
