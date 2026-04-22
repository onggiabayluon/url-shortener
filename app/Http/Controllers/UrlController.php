<?php

namespace App\Http\Controllers;

use App\Models\ShortUrl;
use App\Models\UrlVisit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UrlController extends Controller
{
    public function index(Request $request): Response
    {
        $shortUrls = $request->user()->shortUrls()->latest()->get();

        $totalClicks = $shortUrls->sum('click_count');

        $clicksToday = UrlVisit::whereIn('short_url_id', $shortUrls->pluck('id'))
            ->whereDate('visited_at', today())
            ->count();

        return Inertia::render('urls/index', [
            'urls' => $shortUrls,
            'totalClicks' => $totalClicks,
            'clicksToday' => $clicksToday,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'original_url' => ['required', 'url', 'max:2048'],
        ]);

        $request->user()->shortUrls()->create([
            'original_url' => $validated['original_url'],
            'short_code' => str()->random(6),
        ]);

        return to_route('urls.index');
    }

    public function destroy(Request $request, ShortUrl $shortUrl): RedirectResponse
    {
        abort_unless($request->user()->id === $shortUrl->user_id, 403);

        $shortUrl->delete();

        return to_route('urls.index');
    }
}
