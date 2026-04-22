<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['short_url_id', 'ip_address', 'user_agent', 'referer', 'visited_at'])]
class UrlVisit extends Model
{
    use HasFactory;
    
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
        ];
    }

    public function shortUrl(): BelongsTo
    {
        return $this->belongsTo(ShortUrl::class);
    }
}
