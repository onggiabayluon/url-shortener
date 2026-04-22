<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UrlController extends Controller
{
    public function index(Request $request): Response
    {
        $shortUrls = $request->user()->shortUrls()->latest()->get();

        return Inertia::render('urls/index', [
            'urls' => $shortUrls,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'original_url' => ['required', 'url', 'max:2048'],
        ]);

        $request->user()->shortUrls()->create([
            'original_url' => $validated['original_url'],
            'short_code'   => str()->random(6),
        ]);

        return to_route('urls.index');
    }
}
