# Laravel React Starter Kit

A Laravel + Inertia.js + React application.

## Requirements

- PHP 8.4+
- Composer
- Node.js & npm

## Setup

```bash
composer run setup
```

This installs dependencies, generates the app key, runs migrations, and builds frontend assets.

## Development

```bash
composer run dev
```

This starts all services concurrently:

| Service | Description |
|---------|-------------|
| `php artisan serve` | Laravel server at http://localhost:8000 |
| `npm run dev` | Vite frontend bundler with HMR |
| `php artisan queue:listen` | Queue worker |
| `php artisan pail` | Log viewer |
