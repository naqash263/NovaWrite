<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Contact;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Enquiries are stored even when n8n is down, attributed to their source, rate-limited and listed for admins. */
class LeadCaptureTest extends TestCase
{
    private string $adminToken;

    private string $memberToken;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'auth.defaults.guard' => 'web', 'jwt.secret' => str_repeat('t', 64), 'cache.default' => 'array']);
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
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('subject');
            $table->text('message');
            $table->string('inquiry_type')->default('general');
            $table->string('source', 120)->nullable();
            $table->unsignedBigInteger('file_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
        Schema::create('workflow_downloads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_id')->nullable();
            $table->unsignedBigInteger('workflow_file_id')->nullable();
            $table->string('email')->default('');
            $table->string('download_token')->nullable();
            $table->boolean('marketing_opt_in')->default(false);
            $table->timestamps();
        });

        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'secret-password', 'role' => 'admin']);
        $member = User::create(['name' => 'Member', 'email' => 'member@example.com', 'password' => 'secret-password', 'role' => 'user']);
        $this->adminToken = ApiToken::generateToken();
        $this->memberToken = ApiToken::generateToken();
        ApiToken::create(['user_id' => $admin->id, 'name' => 'test', 'token' => $this->adminToken]);
        ApiToken::create(['user_id' => $member->id, 'name' => 'test', 'token' => $this->memberToken]);

        $this->mock(EmailService::class, fn ($mock) => $mock->shouldReceive('sendTemplateEmail')->andReturn(false));
    }

    private function contactPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Sara Buyer',
            'email' => 'sara@example.com',
            'subject' => 'Automate our invoices',
            'message' => 'We want to automate invoice processing with n8n.',
            'inquiry_type' => 'consultation',
            'source' => 'tool:json-formatter',
        ], $overrides);
    }

    public function test_contact_form_stores_the_lead_with_its_source(): void
    {
        $this->postJson('/api/contact', $this->contactPayload())->assertCreated();

        $contact = Contact::first();
        $this->assertSame('tool:json-formatter', $contact->source);
        $this->assertSame('consultation', $contact->inquiry_type);
    }

    public function test_booking_is_stored_even_when_n8n_is_not_configured(): void
    {
        // Before this change the request returned 503 and the enquiry was lost.
        $this->postJson('/api/bookings', [
            'service_name' => 'AI & Automation',
            'name' => 'Omar Client',
            'email' => 'omar@example.com',
            'budget_range' => '$5k-$10k',
            'timeline' => '1 month',
        ])->assertOk()->assertJson(['success' => true]);

        $lead = Contact::first();
        $this->assertSame('Consultation request: AI & Automation', $lead->subject);
        $this->assertSame('booking:AI & Automation', $lead->source);
        $this->assertStringContainsString('Budget: $5k-$10k', $lead->message);
    }

    public function test_contact_form_is_rate_limited_per_ip(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/contact', $this->contactPayload(['email' => "user{$i}@example.com"]))->assertCreated();
        }
        $this->postJson('/api/contact', $this->contactPayload())->assertStatus(429);
    }

    public function test_leads_are_admin_only(): void
    {
        $this->getJson('/api/admin/leads')->assertStatus(401);
        $this->withHeader('Authorization', "Bearer {$this->memberToken}")->getJson('/api/admin/leads')->assertStatus(403);
    }

    public function test_admin_can_list_filter_read_and_see_stats(): void
    {
        $this->postJson('/api/contact', $this->contactPayload())->assertCreated();
        $this->postJson('/api/contact', $this->contactPayload(['name' => 'Other Person', 'email' => 'other@example.com', 'inquiry_type' => 'project', 'source' => null]))->assertCreated();
        DB::table('workflow_downloads')->insert([
            ['email' => 'fan@example.com', 'marketing_opt_in' => true, 'created_at' => now(), 'updated_at' => now()],
            ['email' => 'fan@example.com', 'marketing_opt_in' => true, 'created_at' => now(), 'updated_at' => now()],
            ['email' => 'quiet@example.com', 'marketing_opt_in' => false, 'created_at' => now(), 'updated_at' => now()],
            ['email' => '', 'marketing_opt_in' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        $admin = $this->withHeader('Authorization', "Bearer {$this->adminToken}");

        $admin->getJson('/api/admin/leads')->assertOk()->assertJsonPath('total', 2);
        $admin->getJson('/api/admin/leads?search=sara')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.email', 'sara@example.com');
        $admin->getJson('/api/admin/leads?inquiry_type=project')->assertOk()->assertJsonPath('total', 1);

        $stats = $admin->getJson('/api/admin/leads/stats')->assertOk();
        $stats->assertJsonPath('total', 2)->assertJsonPath('unread', 2)->assertJsonPath('subscribers', 1);
        $stats->assertJsonPath('top_sources.0.source', 'tool:json-formatter');

        $id = Contact::where('email', 'sara@example.com')->value('id');
        $admin->getJson("/api/admin/leads/{$id}")->assertOk();
        $this->assertTrue(Contact::find($id)->is_read);
        $admin->patchJson("/api/admin/leads/{$id}", ['is_read' => false])->assertOk();
        $this->assertFalse(Contact::find($id)->is_read);

        $subs = $admin->getJson('/api/admin/leads/subscribers')->assertOk();
        $subs->assertJsonPath('total', 1)->assertJsonPath('data.0.email', 'fan@example.com')->assertJsonPath('data.0.downloads', 2);

        $admin->deleteJson("/api/admin/leads/{$id}")->assertOk();
        $this->assertNull(Contact::find($id));
    }
}
