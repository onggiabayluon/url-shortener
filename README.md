# URL Shortener

A simple URL shortener built with Laravel 13, Inertia.js v3, React 19, and Tailwind CSS v4.

Create short links, track click counts, and manage your URLs from a dashboard.

## Stack

- **Laravel 13** — backend framework (routing, auth, database)
- **Inertia.js v3** — connects Laravel controllers to React pages without a separate API
- **React 19** — frontend UI
- **Tailwind CSS v4** — utility-first styling
- **SQLite** — file-based database (no server needed)

## Getting Started

```bash
# Install dependencies and run migrations
composer run setup

# Start all dev servers (Laravel + Vite)
composer run dev
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Useful Commands

```bash
# Run tests
php artisan test --compact

# List all routes
php artisan route:list --except-vendor

# Regenerate Wayfinder TypeScript types (after adding routes/controllers)
php artisan wayfinder:generate

# Format PHP files
vendor/bin/pint --dirty
```
