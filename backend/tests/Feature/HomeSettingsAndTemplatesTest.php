<?php

namespace Tests\Feature;

use App\Models\EmailTemplate;
use App\Models\HomeSettings;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class HomeSettingsAndTemplatesTest extends TestCase
{
    public function test_public_home_settings_endpoint_returns_active_settings(): void
    {
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        Schema::create('home_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->string('type');
            $table->text('value')->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
        HomeSettings::create(['key' => 'notification_enabled', 'type' => 'boolean', 'value' => '1', 'is_active' => true]);
        HomeSettings::create(['key' => 'hero_image', 'type' => 'image', 'value' => 'home/hero.webp', 'is_active' => true, 'sort_order' => 1]);
        HomeSettings::create(['key' => 'old_banner', 'type' => 'text', 'value' => 'hidden', 'is_active' => false]);

        $response = $this->getJson('/api/home-settings')->assertOk();
        $settings = collect($response->json('settings'));
        $this->assertEqualsCanonicalizing(['notification_enabled', 'hero_image'], $settings->pluck('key')->all());
        $this->assertStringEndsWith('/storage/home/hero.webp', $settings->firstWhere('key', 'hero_image')['image_url']);
    }

    public function test_email_template_placeholders_are_replaced_without_stray_braces(): void
    {
        $template = new EmailTemplate();
        $template->forceFill(['subject' => 'Welcome, {{name}}!', 'body' => '<p>Hi {{name}}, your code is {{code}}.</p>']);
        $rendered = $template->render(['name' => 'John Doe', 'code' => 42]);

        $this->assertSame('Welcome, John Doe!', $rendered['subject']);
        $this->assertSame('<p>Hi John Doe, your code is 42.</p>', $rendered['body']);
    }
}
