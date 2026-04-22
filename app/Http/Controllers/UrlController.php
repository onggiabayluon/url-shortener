<?php

namespace App\Http\Controllers;

use App\Models\ShortUrl;
use App\Models\UrlVisit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UrlController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $shortUrls = $user?->shortUrls()->latest()->get() ?? collect();

        $totalClicks = $user !== null ? $shortUrls->sum('click_count') : 0;

        $clicksToday = $user !== null
            ? UrlVisit::whereIn('short_url_id', $shortUrls->pluck('id'))
                ->whereDate('visited_at', today())
                ->count()
            : 0;

        return Inertia::render('urls/index', [
            'urls' => $shortUrls,
            'totalClicks' => $totalClicks,
            'clicksToday' => $clicksToday,
            'canManageUrls' => $user !== null,
            'latestShortCode' => $request->session()->get('latest_short_code'),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'original_url' => ['required', 'url', 'max:2048'],
        ]);

        $shortUrl = ShortUrl::create([
            'user_id' => $request->user()?->id,
            'original_url' => $validated['original_url'],
            'short_code' => str()->random(6),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'short_code' => $shortUrl->short_code,
                'short_url' => url('/'.$shortUrl->short_code),
            ]);
        }

        return to_route('urls.index')->with('latest_short_code', $shortUrl->short_code);
    }

    public function destroy(Request $request, ShortUrl $shortUrl): RedirectResponse
    {
        abort_unless($request->user()->id === $shortUrl->user_id, 403);

        $shortUrl->delete();

        return to_route('urls.index');
    }
}
