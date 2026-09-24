<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Tests\TestCase;

/** Static admin paths must not be swallowed by {id} routes declared before them. */
class RouteOrderTest extends TestCase
{
    public function test_static_admin_paths_resolve_to_their_own_actions(): void
    {
        $routes = $this->app['router']->getRoutes();
        foreach ([
            '/api/admin/email-queue/stats' => 'stats',
            '/api/admin/email-queue/5' => 'show',
            '/api/admin/email-logs/stats' => 'stats',
            '/api/admin/email-logs/5' => 'show',
            '/api/admin/smtp-configurations/mailer-types' => 'getMailerTypes',
            '/api/admin/smtp-configurations/encryption-types' => 'getEncryptionTypes',
            '/api/admin/smtp-configurations/common-ports' => 'getCommonPorts',
            '/api/admin/smtp-configurations/active' => 'getActive',
            '/api/admin/smtp-configurations/default' => 'getDefault',
            '/api/admin/smtp-configurations/3' => 'show',
        ] as $uri => $method) {
            $this->assertSame($method, $routes->match(Request::create($uri, 'GET'))->getActionMethod(), $uri);
        }
    }
}
