<?php

namespace App\Http\Controllers;

use App\Models\ShortUrl;
use App\Models\UrlVisit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RedirectController extends Controller
{
    public function show(Request $request, string $code): RedirectResponse
    {
        // Cache only plain data — never Eloquent models, which break on unserialize
        // when the class hasn't been autoloaded yet at cache-read time.
        $cached = Cache::remember(
            'short_url:'.$code,
            now()->addHours(24),
            function () use ($code) {
                $shortUrl = ShortUrl::where('short_code', $code)->first();

                if ($shortUrl === null) {
                    return null;
                }

                return [
                    'id' => $shortUrl->id,
                    'original_url' => $shortUrl->original_url,
                    'expires_at' => $shortUrl->expires_at?->toIso8601String(),
                ];
            }
        );

        abort_if($cached === null, 404);

        if ($cached['expires_at'] !== null && now()->gt($cached['expires_at'])) {
            Cache::forget('short_url:'.$code);
            abort(410, 'This link has expired.');
        }

        UrlVisit::create([
            'short_url_id' => $cached['id'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->header('referer'),
        ]);

        ShortUrl::where('id', $cached['id'])->increment('click_count');

        return redirect()->away($cached['original_url']);
    }
}
