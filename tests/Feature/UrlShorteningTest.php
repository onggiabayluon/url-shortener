<?php

namespace Tests\Feature;

use App\Models\ShortUrl;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class UrlShorteningTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_shorten_page(): void
    {
        $response = $this->get(route('urls.index'));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('urls/index')
            ->where('canManageUrls', false)
            ->where('totalClicks', 0)
            ->where('clicksToday', 0)
            ->where('urls', [])
        );
    }

    public function test_guests_can_shorten_urls(): void
    {
        $response = $this->post(route('urls.store'), [
            'original_url' => 'https://example.com/guest-link',
        ]);

        $response->assertRedirect(route('urls.index', absolute: false));

        $this->assertDatabaseHas('short_urls', [
            'original_url' => 'https://example.com/guest-link',
            'user_id' => null,
        ]);
    }

    public function test_guests_can_shorten_urls_via_json_endpoint(): void
    {
        $response = $this->postJson(route('urls.store'), [
            'original_url' => 'https://example.com/json-link',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'short_code',
            'short_url',
        ]);

        $this->assertDatabaseHas('short_urls', [
            'original_url' => 'https://example.com/json-link',
            'user_id' => null,
        ]);
    }

    public function test_authenticated_users_only_see_their_own_url_history(): void
    {
        $user = User::factory()->create();
        $anotherUser = User::factory()->create();

        ShortUrl::create([
            'user_id' => $user->id,
            'original_url' => 'https://example.com/my-url',
            'short_code' => 'MINE01',
        ]);

        ShortUrl::create([
            'user_id' => $anotherUser->id,
            'original_url' => 'https://example.com/other-url',
            'short_code' => 'THEIRS',
        ]);

        $response = $this->actingAs($user)->get(route('urls.index'));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('urls/index')
            ->where('canManageUrls', true)
            ->has('urls', 1)
            ->where('urls.0.short_code', 'MINE01')
        );
    }

    public function test_guest_created_short_url_can_redirect(): void
    {
        $shortUrl = ShortUrl::create([
            'user_id' => null,
            'original_url' => 'https://example.com/redirect-target',
            'short_code' => 'GUEST1',
        ]);

        $response = $this->get(route('redirect.show', ['code' => $shortUrl->short_code]));

        $response->assertRedirect('https://example.com/redirect-target');

        $this->assertDatabaseHas('url_visits', [
            'short_url_id' => $shortUrl->id,
        ]);

        $this->assertDatabaseHas('short_urls', [
            'id' => $shortUrl->id,
            'click_count' => 1,
        ]);
    }
}
