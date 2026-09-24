<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Regression tests for debug/maintenance endpoints that used to be publicly reachable:
 * one ran database migrations, others returned APP_KEY or created data without authentication.
 */
class PublicEndpointSecurityTest extends TestCase
{
    public function test_removed_debug_endpoints_are_gone(): void
    {
        foreach ([
            ['post', '/api/debug/run-migrations'],
            ['post', '/api/debug/api-token-test'],
            ['post', '/api/debug/simple-api-token'],
            ['post', '/api/debug/create-gemini-table'],
            ['post', '/api/test-cv-template'],
            ['get', '/api/debug/jwt'],
            ['get', '/api/debug/database'],
            ['get', '/api/debug/all-connections'],
            ['get', '/api/debug/auth-test'],
            ['get', '/api/debug/gemini-api-keys'],
            ['get', '/api/cv-ai/debug-keys'],
            ['post', '/api/cv-ai/create-temp-key'],
        ] as [$method, $uri]) {
            $this->json($method, $uri)->assertNotFound();
        }
    }

    public function test_admin_only_maintenance_endpoints_require_authentication(): void
    {
        $this->getJson('/api/cv-ai/fix-keys')->assertUnauthorized();
        $this->postJson('/api/admin/cv-templates-temp', ['name' => 'x'])->assertUnauthorized();
    }

    public function test_encryption_health_check_never_returns_the_app_key(): void
    {
        $key = 'base64:'.base64_encode(str_repeat('k', 32));
        config(['app.key' => $key]);
        $response = $this->getJson('/api/cv-ai/check-encryption');
        $this->assertStringNotContainsString($key, $response->getContent());
        $this->assertStringNotContainsString(base64_encode(str_repeat('k', 32)), $response->getContent());
    }
}
