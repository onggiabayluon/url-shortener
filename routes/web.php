<?php

use App\Http\Controllers\RedirectController;
use App\Http\Controllers\UrlController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/urls', [UrlController::class, 'index'])->name('urls.index');
Route::post('/urls', [UrlController::class, 'store'])->name('urls.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::delete('/urls/{shortUrl}', [UrlController::class, 'destroy'])->name('urls.destroy');
});

// Public redirect — must be last to avoid matching /dashboard, /login, etc.
Route::get('/{code}', [RedirectController::class, 'show'])
    ->where('code', '[a-zA-Z0-9]{3,10}')
    ->name('redirect.show');

require __DIR__.'/settings.php';
