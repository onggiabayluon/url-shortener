import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import UrlController from '@/actions/App/Http/Controllers/UrlController';
import { login, register } from '@/routes';
import { index } from '@/routes/urls';

function useCountUp(target: number, duration = 1800, start = false): number {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start) {
            return;
        }

        let startTime: number | null = null;

        const tick = (timestamp: number) => {
            if (startTime === null) {
                startTime = timestamp;
            }

            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * target);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [start, target, duration]);

    return value;
}

function useInView<T extends HTMLElement>(ref: RefObject<T | null>): boolean {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                }
            },
            { threshold: 0.3 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [ref]);

    return inView;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_DATA = [45, 72, 58, 89, 134, 98, 112];
const BAR_HEIGHT_CLASSES = [
    'h-[33.58%]',
    'h-[53.73%]',
    'h-[43.28%]',
    'h-[66.42%]',
    'h-[100%]',
    'h-[73.13%]',
    'h-[83.58%]',
];

type ShortResult = {
    short: string;
    original: string;
    created: string;
    clicks: number;
};

function HeroShortener() {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState<ShortResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const isValidUrl = (value: string): boolean => {
        try {
            const normalized = value.startsWith('http')
                ? value
                : `https://${value}`;
            const parsedUrl = new URL(normalized);

            void parsedUrl;

            return true;
        } catch {
            return false;
        }
    };

    const shorten = async (): Promise<void> => {
        if (!url.trim()) {
            setError('Paste a URL first.');

            return;
        }

        if (!isValidUrl(url)) {
            setError("That doesn't look like a valid URL.");

            return;
        }

        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

        setError('');
        setLoading(true);
        setResult(null);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(UrlController.store.url(), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ original_url: normalizedUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                const validationError = Array.isArray(data?.errors?.original_url)
                    ? data.errors.original_url[0]
                    : data?.message;

                setError(validationError ?? 'Something went wrong.');

                return;
            }

            setResult({
                short: data.short_url,
                original: normalizedUrl,
                created: 'just now',
                clicks: 0,
            });
        } catch {
            setError('Could not shorten this URL right now. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copy = (): void => {
        if (!result) {
            return;
        }

        navigator.clipboard.writeText(result.short).catch(() => {});
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const handleKey = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            void shorten();
        }
    };

    return (
        <div className="w-full max-w-[720px]">
            <div className="flex items-stretch gap-1.5 rounded-[14px] border border-[oklch(0.87_0.008_80)] bg-white p-1.5 shadow-[0_2px_12px_oklch(0_0_0_/_0.07),0_0_0_4px_oklch(0.45_0.18_155_/_0.10)] transition-[border-color,box-shadow] focus-within:border-[oklch(0.45_0.18_155)] focus-within:shadow-[0_4px_24px_oklch(0_0_0_/_0.1),0_0_0_4px_oklch(0.45_0.18_155_/_0.10)]">
                <input
                    className="min-w-0 flex-1 border-0 bg-transparent px-[18px] py-4 font-['JetBrains_Mono'] text-[15px] text-[oklch(0.18_0.01_255)] outline-none placeholder:text-[oklch(0.52_0.01_255)]"
                    type="text"
                    placeholder="https://your-very-long-url.com/goes/right/here"
                    value={url}
                    onChange={(event) => {
                        setUrl(event.target.value);
                        setError('');
                    }}
                    onKeyDown={handleKey}
                    autoFocus
                />
                <button
                    className="shrink-0 rounded-[10px] border-0 bg-[oklch(0.18_0.01_255)] px-7 py-[14px] font-['Space_Grotesk'] text-sm font-bold whitespace-nowrap text-[oklch(0.98_0.004_80)] transition-[opacity,transform] hover:scale-[1.02] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void shorten()}
                    disabled={loading}
                    type="button"
                >
                    {loading ? '...' : 'Shorten ->'}
                </button>
            </div>

            {error && (
                <div className="mt-2 px-1 text-left font-['JetBrains_Mono'] text-[13px] text-[oklch(0.55_0.18_25)]">
                    Warning: {error}
                </div>
            )}

            {result && (
                <div className="mt-3 flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-[oklch(0.45_0.18_155)] bg-[oklch(0.95_0.006_80)] px-5 py-4">
                    <span className="flex-1 overflow-hidden text-left font-['JetBrains_Mono'] text-base font-bold text-ellipsis whitespace-nowrap text-[oklch(0.45_0.18_155)]">
                        {result.short}
                    </span>
                    <button
                        className={`shrink-0 rounded-lg border border-[oklch(0.45_0.18_155)] px-4 py-2 font-['Space_Grotesk'] text-[13px] font-semibold whitespace-nowrap transition-colors ${
                            copied
                                ? 'bg-[oklch(0.45_0.18_155)] text-white'
                                : 'bg-[oklch(0.45_0.18_155_/_0.10)] text-[oklch(0.45_0.18_155)] hover:bg-[oklch(0.45_0.18_155)] hover:text-[oklch(0.98_0.004_80)]'
                        }`}
                        onClick={copy}
                        type="button"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            )}

            {result && (
                <div className="mt-2 flex items-center gap-4 px-1">
                    <span className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs text-[oklch(0.52_0.01_255)]">
                        <span className="text-[oklch(0.45_0.18_155)]">
                            &rarr;
                        </span>
                        {result.original.length > 40
                            ? `${result.original.slice(0, 40)}...`
                            : result.original}
                    </span>
                    <span className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs text-[oklch(0.52_0.01_255)]">
                        <span className="text-[oklch(0.45_0.18_155)]">*</span>
                        Created {result.created}
                    </span>
                </div>
            )}
        </div>
    );
}

function StatsSection() {
    const ref = useRef<HTMLElement | null>(null);
    const inView = useInView(ref);
    const links = useCountUp(2847193, 2000, inView);
    const clicks = useCountUp(48, 1800, inView);
    const uptime = useCountUp(99.98, 1600, inView);

    return (
        <section
            className="mx-auto max-w-[1100px] px-12 py-[100px] max-md:px-5 max-md:py-[60px]"
            id="stats"
            ref={ref}
        >
            <div className="mb-4 font-['JetBrains_Mono'] text-[11px] font-medium tracking-[2px] text-[oklch(0.45_0.18_155)] uppercase">
                By the numbers
            </div>
            <h2 className="mb-16 max-w-[560px] text-[clamp(32px,4vw,52px)] leading-[1.1] font-bold tracking-[-2px]">
                Built for scale.
                <br />
                Designed for clarity.
            </h2>
            <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl bg-[oklch(0.87_0.008_80)] max-md:grid-cols-1">
                <div className="relative overflow-hidden bg-[oklch(0.95_0.006_80)] px-10 py-12 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.6)]">
                    <div className="mb-3 font-['JetBrains_Mono'] text-[56px] leading-none font-bold tracking-[-3px] text-[oklch(0.18_0.01_255)]">
                        {Math.round(links).toLocaleString()}
                        <span className="text-[28px] text-[oklch(0.45_0.18_155)]">
                            +
                        </span>
                    </div>
                    <div className="text-[15px] text-[oklch(0.52_0.01_255)]">
                        Links shortened
                    </div>
                    <div className="mt-2 font-['JetBrains_Mono'] text-[13px] text-[oklch(0.45_0.18_155_/_0.7)]">
                        &rarr; and counting
                    </div>
                </div>
                <div className="relative overflow-hidden bg-[oklch(0.95_0.006_80)] px-10 py-12 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.6)]">
                    <div className="mb-3 font-['JetBrains_Mono'] text-[56px] leading-none font-bold tracking-[-3px] text-[oklch(0.18_0.01_255)]">
                        {clicks.toFixed(1)}
                        <span className="text-[28px] text-[oklch(0.45_0.18_155)]">
                            M
                        </span>
                    </div>
                    <div className="text-[15px] text-[oklch(0.52_0.01_255)]">
                        Clicks tracked daily
                    </div>
                    <div className="mt-2 font-['JetBrains_Mono'] text-[13px] text-[oklch(0.45_0.18_155_/_0.7)]">
                        &rarr; real-time data
                    </div>
                </div>
                <div className="relative overflow-hidden bg-[oklch(0.95_0.006_80)] px-10 py-12 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.6)]">
                    <div className="mb-3 font-['JetBrains_Mono'] text-[56px] leading-none font-bold tracking-[-3px] text-[oklch(0.18_0.01_255)]">
                        {uptime.toFixed(2)}
                        <span className="text-[28px] text-[oklch(0.45_0.18_155)]">
                            %
                        </span>
                    </div>
                    <div className="text-[15px] text-[oklch(0.52_0.01_255)]">
                        Uptime SLA
                    </div>
                    <div className="mt-2 font-['JetBrains_Mono'] text-[13px] text-[oklch(0.45_0.18_155_/_0.7)]">
                        &rarr; global CDN
                    </div>
                </div>
            </div>
        </section>
    );
}

function ClickChart() {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="rounded-xl border border-[oklch(0.87_0.008_80)] bg-[oklch(0.98_0.004_80)] p-6 font-['JetBrains_Mono']">
            <div className="mb-5 flex items-center justify-between">
                <span className="text-[13px] text-[oklch(0.52_0.01_255)]">
                    clicks / day
                </span>
                <span className="text-2xl font-bold text-[oklch(0.45_0.18_155)]">
                    {hovered !== null
                        ? BAR_DATA[hovered]
                        : BAR_DATA[BAR_DATA.length - 1]}
                </span>
            </div>
            <div className="flex h-20 items-end gap-[5px]">
                {BAR_DATA.map((value, index) => (
                    <div
                        key={value}
                        className={`${BAR_HEIGHT_CLASSES[index]} flex-1 cursor-default rounded-t-[3px] border border-b-0 border-[oklch(0.87_0.008_80)] transition-opacity hover:opacity-80 ${
                            hovered === index
                                ? 'bg-[oklch(0.45_0.18_155)]'
                                : index === BAR_DATA.length - 1
                                  ? 'bg-[oklch(0.45_0.18_155_/_0.10)]'
                                  : 'bg-[oklch(0.92_0.007_80)]'
                        }`}
                        onMouseEnter={() => {
                            setHovered(index);
                        }}
                        onMouseLeave={() => {
                            setHovered(null);
                        }}
                    />
                ))}
            </div>
            <div className="mt-2 flex gap-[5px]">
                {DAYS.map((day, index) => (
                    <span
                        className="flex-1 text-center text-[10px] text-[oklch(0.52_0.01_255)]"
                        key={`${day}-${index}`}
                    >
                        {day}
                    </span>
                ))}
            </div>
        </div>
    );
}

const SAMPLE_LINKS = [
    {
        short: 'snip.io/q7f2a',
        dest: 'notion.so/team/roadmap',
        clicks: '3,841',
        trend: '+24%',
        up: true,
    },
    {
        short: 'snip.io/mk9px',
        dest: 'github.com/org/repo/pull/1204',
        clicks: '1,293',
        trend: '+8%',
        up: true,
    },
    {
        short: 'snip.io/b3tt0',
        dest: 'figma.com/file/xKJ…',
        clicks: '988',
        trend: '-3%',
        up: false,
    },
    {
        short: 'snip.io/zn4wr',
        dest: 'docs.acme.com/getting-started',
        clicks: '724',
        trend: '+41%',
        up: true,
    },
];

function FeaturesSection() {
    return (
        <section
            className="mx-auto max-w-[1100px] px-12 pb-[100px] max-md:px-5"
            id="features"
        >
            <div className="mb-4 font-['JetBrains_Mono'] text-[11px] font-medium tracking-[2px] text-[oklch(0.45_0.18_155)] uppercase">
                What you get
            </div>
            <h2 className="mb-10 max-w-[560px] text-[clamp(32px,4vw,52px)] leading-[1.1] font-bold tracking-[-2px]">
                Every click tells a story.
            </h2>
            <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-[oklch(0.87_0.008_80)] max-md:grid-cols-1">
                <div className="col-span-2 grid grid-cols-2 items-center gap-12 bg-[oklch(0.95_0.006_80)] px-11 py-12 max-md:col-span-1 max-md:grid-cols-1">
                    <div>
                        <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                            ▦
                        </div>
                        <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                            Daily click tracking
                        </div>
                        <p className="text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                            Watch your links perform in real time. Day-by-day
                            breakdowns, peak traffic windows, and trend analysis
                            - all in one view.
                        </p>
                        <div className="mt-7">
                            <ClickChart />
                        </div>
                    </div>
                    <div>
                        <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                            ⊞
                        </div>
                        <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                            All your links, at a glance
                        </div>
                        <p className="mb-6 text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                            Manage every shortened link from a unified
                            dashboard. Sort, filter, and act instantly.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[13px]">
                                <thead>
                                    <tr>
                                        <th className="border-b border-[oklch(0.87_0.008_80)] pb-3 text-left font-medium text-[oklch(0.52_0.01_255)]">
                                            Short link
                                        </th>
                                        <th className="border-b border-[oklch(0.87_0.008_80)] pb-3 text-left font-medium text-[oklch(0.52_0.01_255)]">
                                            Destination
                                        </th>
                                        <th className="border-b border-[oklch(0.87_0.008_80)] pb-3 text-left font-medium text-[oklch(0.52_0.01_255)]">
                                            Clicks
                                        </th>
                                        <th className="border-b border-[oklch(0.87_0.008_80)] pb-3 text-left font-medium text-[oklch(0.52_0.01_255)]">
                                            7d
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SAMPLE_LINKS.map((link) => (
                                        <tr key={link.short}>
                                            <td className="border-b border-[oklch(0.22_0.012_255_/_0.5)] py-3.5 font-['JetBrains_Mono'] text-[oklch(0.45_0.18_155)] last:border-b-0">
                                                {link.short}
                                            </td>
                                            <td className="max-w-40 overflow-hidden border-b border-[oklch(0.22_0.012_255_/_0.5)] py-3.5 font-['JetBrains_Mono'] text-xs text-ellipsis whitespace-nowrap text-[oklch(0.52_0.01_255)] last:border-b-0">
                                                {link.dest}
                                            </td>
                                            <td className="border-b border-[oklch(0.22_0.012_255_/_0.5)] py-3.5 font-['JetBrains_Mono'] font-bold last:border-b-0">
                                                {link.clicks}
                                            </td>
                                            <td className="border-b border-[oklch(0.22_0.012_255_/_0.5)] py-3.5 last:border-b-0">
                                                <span
                                                    className={`rounded px-2 py-[3px] font-['JetBrains_Mono'] text-[11px] font-bold ${
                                                        link.up
                                                            ? 'bg-[oklch(0.85_0.22_140_/_0.12)] text-[oklch(0.45_0.18_155)]'
                                                            : 'bg-[oklch(0.7_0.22_25_/_0.12)] text-[oklch(0.55_0.18_25)]'
                                                    }`}
                                                >
                                                    {link.trend}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-[oklch(0.95_0.006_80)] px-11 py-12 transition-colors hover:bg-[oklch(0.92_0.007_80)]">
                    <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                        ◉
                    </div>
                    <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                        Custom slugs
                    </div>
                    <p className="text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                        Make links memorable. Replace random codes with branded
                        slugs -
                        <span className="font-['JetBrains_Mono'] text-[13px] text-[oklch(0.45_0.18_155)]">
                            {' '}
                            snip.io/launch
                        </span>{' '}
                        instead of gibberish.
                    </p>
                </div>

                <div className="bg-[oklch(0.95_0.006_80)] px-11 py-12 transition-colors hover:bg-[oklch(0.92_0.007_80)]">
                    <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                        ⧖
                    </div>
                    <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                        Link expiration
                    </div>
                    <p className="text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                        Set links to expire after a date or a number of clicks.
                        Perfect for time-sensitive campaigns and temporary
                        access.
                    </p>
                </div>

                <div className="bg-[oklch(0.95_0.006_80)] px-11 py-12 transition-colors hover:bg-[oklch(0.92_0.007_80)]">
                    <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                        ◈
                    </div>
                    <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                        Geo and device breakdown
                    </div>
                    <p className="text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                        Know exactly where your audience comes from. Country,
                        city, device type, browser - all logged, all searchable.
                    </p>
                </div>

                <div className="bg-[oklch(0.95_0.006_80)] px-11 py-12 transition-colors hover:bg-[oklch(0.92_0.007_80)]">
                    <div className="mb-6 flex size-11 items-center justify-center rounded-[10px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.92_0.007_80)] text-xl text-[oklch(0.45_0.18_155)]">
                        ⌘
                    </div>
                    <div className="mb-3 text-[22px] font-semibold tracking-[-0.5px]">
                        API-first design
                    </div>
                    <p className="text-[15px] leading-[1.65] text-[oklch(0.52_0.01_255)]">
                        Integrate snip into your stack in minutes. REST API with
                        full docs, webhooks, and SDKs for Node, Python, and Go.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default function Welcome({ canRegister }: { canRegister: boolean }) {
    const { auth } = usePage().props as { auth: { user: unknown } };
    const authHref = auth.user ? index() : canRegister ? register() : login();

    return (
        <>
            <Head title="snip - URL Shortener">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
                />
            </Head>

            <div className="overflow-x-hidden bg-[oklch(0.98_0.004_80)] font-['Space_Grotesk'] text-[oklch(0.18_0.01_255)] antialiased">
                <nav className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between bg-gradient-to-b from-[oklch(0.98_0.004_80)] to-transparent px-12 py-5 max-md:px-5 max-md:py-4">
                    <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[22px] font-bold tracking-[-0.5px]">
                        snip
                        <span className="text-[oklch(0.45_0.18_155)]">.</span>
                    </div>
                    <ul className="flex items-center gap-8 text-sm font-medium text-[oklch(0.52_0.01_255)] max-md:hidden">
                        <li>
                            <a
                                className="transition-colors hover:text-[oklch(0.18_0.01_255)]"
                                href="#features"
                            >
                                Features
                            </a>
                        </li>
                        <li>
                            <a
                                className="transition-colors hover:text-[oklch(0.18_0.01_255)]"
                                href="#stats"
                            >
                                Analytics
                            </a>
                        </li>
                        {/* <li>
                            <a
                                className="transition-colors hover:text-[oklch(0.18_0.01_255)]"
                                href="#"
                            >
                                Pricing
                            </a>
                        </li>
                        <li>
                            <a
                                className="transition-colors hover:text-[oklch(0.18_0.01_255)]"
                                href="#"
                            >
                                Docs
                            </a>
                        </li> */}
                    </ul>
                    <Link
                        className="rounded-lg bg-[oklch(0.18_0.01_255)] px-[22px] py-2.5 text-sm font-semibold text-[oklch(0.98_0.004_80)] transition-[opacity,transform] hover:-translate-y-px hover:opacity-90"
                        href={authHref}
                    >
                        {auth.user ? 'Dashboard' : 'Get started free'}
                    </Link>
                </nav>

                <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-[120px] pb-20 text-center">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(oklch(0.87_0.008_80)_1px,transparent_1px),linear-gradient(90deg,oklch(0.87_0.008_80)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_80%)] bg-[size:60px_60px] opacity-70" />
                        <div className="absolute top-[20%] left-1/2 h-[400px] w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse,oklch(0.45_0.18_155_/_0.15)_0%,transparent_70%)]" />
                    </div>

                    <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-[oklch(0.87_0.008_80)] bg-[oklch(0.95_0.006_80)] px-3.5 py-1.5 font-['JetBrains_Mono'] text-xs text-[oklch(0.45_0.18_155)]">
                        <span className="size-1.5 rounded-full bg-[oklch(0.45_0.18_155)] shadow-[0_0_8px_oklch(0.45_0.18_155)]" />
                        Now with real-time analytics
                    </div>

                    <h1 className="mb-6 text-[clamp(52px,8vw,96px)] leading-[1] font-bold tracking-[-3px]">
                        Long URLs,
                        <br />
                        <span className="text-[oklch(0.45_0.18_155)]">
                            snipped
                        </span>{' '}
                        short.
                    </h1>

                    <p className="mb-14 max-w-[480px] text-lg leading-[1.6] text-[oklch(0.52_0.01_255)]">
                        Shorten, share, and track any link - with beautiful
                        analytics that show you exactly where your clicks come
                        from.
                    </p>

                    <HeroShortener />
                </section>

                {/* <div className="overflow-hidden bg-[oklch(0.18_0.01_255)] py-3 font-['JetBrains_Mono'] text-[13px] font-bold whitespace-nowrap text-[oklch(0.98_0.004_80)]">
                    <div className="inline-flex animate-[ticker_18s_linear_infinite] gap-0">
                        {[...Array(2)].map((_, rowIndex) =>
                            [
                                'snip.io/q7f2a -> 3,841 clicks',
                                'snip.io/launch -> 12K clicks',
                                '99.98% uptime',
                                'Real-time analytics',
                                'Custom slugs',
                                'API-first',
                                'Geo tracking',
                                'Link expiration',
                                '2.8M links shortened',
                            ].map((text, index) => (
                                <span
                                    className="px-10"
                                    key={`${rowIndex}-${index}`}
                                >
                                    {text} <span className="opacity-40">.</span>
                                </span>
                            )),
                        )}
                    </div>
                </div> */}

                <StatsSection />
                <FeaturesSection />

                <div className="mx-auto max-w-[1100px] px-12 pb-20 max-md:px-5 max-md:pb-[60px]">
                    <div className="relative overflow-hidden rounded-[20px] border border-[oklch(0.87_0.008_80)] bg-[oklch(0.95_0.006_80)] px-16 py-20 text-center max-md:px-6 max-md:py-[60px]">
                        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[200px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,oklch(0.45_0.18_155_/_0.15)_0%,transparent_70%)]" />
                        <h2 className="relative mb-4 text-[clamp(36px,4vw,60px)] font-bold tracking-[-2px]">
                            Start shortening.
                            <br />
                            Start knowing.
                        </h2>
                        <p className="relative mb-10 text-base text-[oklch(0.52_0.01_255)]">
                            Free for the first 1,000 links. No credit card
                            required.
                        </p>
                        <div className="relative flex justify-center gap-3">
                            <Link
                                className="rounded-[10px] bg-[oklch(0.18_0.01_255)] px-9 py-4 text-[15px] font-bold text-[oklch(0.98_0.004_80)] transition-[opacity,transform] hover:-translate-y-px hover:opacity-90"
                                href={authHref}
                            >
                                Create free account
                            </Link>
                            <a
                                className="rounded-[10px] border border-[oklch(0.87_0.008_80)] px-9 py-4 text-[15px] font-semibold transition-[border-color,transform] hover:-translate-y-px hover:border-[oklch(0.52_0.01_255)]"
                                href="#"
                            >
                                View docs
                            </a>
                        </div>
                    </div>
                </div>

                <footer className="flex items-center justify-between border-t border-[oklch(0.87_0.008_80)] px-12 py-8 max-md:flex-col max-md:gap-4 max-md:px-5 max-md:text-center">
                    <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-lg font-bold tracking-[-0.5px]">
                        snip
                        <span className="text-[oklch(0.45_0.18_155)]">.</span>
                    </div>
                    <div className="flex gap-6">
                        <a
                            className="text-[13px] text-[oklch(0.52_0.01_255)] transition-colors hover:text-[oklch(0.18_0.01_255)]"
                            href="#"
                        >
                            Privacy
                        </a>
                        <a
                            className="text-[13px] text-[oklch(0.52_0.01_255)] transition-colors hover:text-[oklch(0.18_0.01_255)]"
                            href="#"
                        >
                            Terms
                        </a>
                        <a
                            className="text-[13px] text-[oklch(0.52_0.01_255)] transition-colors hover:text-[oklch(0.18_0.01_255)]"
                            href="#"
                        >
                            Status
                        </a>
                        <a
                            className="text-[13px] text-[oklch(0.52_0.01_255)] transition-colors hover:text-[oklch(0.18_0.01_255)]"
                            href="#"
                        >
                            API
                        </a>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[13px] text-[oklch(0.52_0.01_255)]">
                        © 2026 snip.io
                    </span>
                </footer>
            </div>

            <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </>
    );
}
