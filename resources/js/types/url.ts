export type ShortUrl = {
    id: number;
    user_id: number;
    original_url: string;
    short_code: string;
    click_count: number;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
};
