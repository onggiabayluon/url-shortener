import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import UrlController from '@/actions/App/Http/Controllers/UrlController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { index } from '@/routes/urls';
import type { ShortUrl } from '@/types/url';

export default function Urls({
    urls,
    totalClicks,
    clicksToday,
}: {
    urls: ShortUrl[];
    totalClicks: number;
    clicksToday: number;
}) {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const copyUrl = (url: ShortUrl) => {
        const shortUrl = `${window.location.origin}/${url.short_code}`;
        navigator.clipboard.writeText(shortUrl).then(() => {
            setCopiedId(url.id);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <>
            <Head title="My URLs" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-sidebar-border/70 p-6">
                        <div className="text-3xl font-bold">{urls.length}</div>
                        <div className="mt-1 text-sm text-muted-foreground">Total links</div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 p-6">
                        <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
                        <div className="mt-1 text-sm text-muted-foreground">Total clicks</div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 p-6">
                        <div className="text-3xl font-bold">{clicksToday.toLocaleString()}</div>
                        <div className="mt-1 text-sm text-muted-foreground">Clicks today</div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Shorten a URL</h2>
                    <Form {...UrlController.store.form()}>
                        {({ processing, errors }) => (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        name="original_url"
                                        type="url"
                                        placeholder="https://your-long-url.com/goes/here"
                                        className="flex-1"
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Shortening...' : 'Shorten'}
                                    </Button>
                                </div>
                                <InputError message={errors.original_url} />
                            </div>
                        )}
                    </Form>
                </div>

                <div className="rounded-xl border border-sidebar-border/70">
                    {urls.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-lg font-medium">No URLs yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Paste a URL above to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-sidebar-border/70">
                                        <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                                            Short URL
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                                            Destination
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                                            Clicks
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                                            Created
                                        </th>
                                        <th className="px-6 py-4" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {urls.map((url) => (
                                        <tr
                                            key={url.id}
                                            className="border-b border-sidebar-border/70 transition-colors last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">
                                                        /{url.short_code}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={() => copyUrl(url)}
                                                        type="button"
                                                    >
                                                        {copiedId === url.id ? 'Copied!' : 'Copy'}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="max-w-xs px-6 py-4">
                                                <a
                                                    href={url.original_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                                    title={url.original_url}
                                                >
                                                    {url.original_url}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium">
                                                    {url.click_count.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(url.created_at).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Form
                                                    {...UrlController.destroy.form(url.id)}
                                                    onBefore={() =>
                                                        confirm('Delete this URL? All visit data will be lost.')
                                                    }
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={processing}
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </Form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Urls.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'My URLs', href: index() },
    ],
};
