# ── Stage 1: Build (PHP + Node together — Wayfinder runs php artisan during npm build) ──
FROM php:8.4-fpm-alpine AS builder
WORKDIR /var/www/html

RUN apk add --no-cache sqlite-dev nodejs npm \
    && docker-php-ext-install pdo_sqlite

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP deps cached separately from app code
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Node deps cached separately from app code
COPY package*.json ./
RUN npm ci

COPY . .

# Minimal env so Laravel can boot when wayfinder:generate runs inside npm build
RUN printf "APP_KEY=base64:%s\nAPP_ENV=local\nDB_CONNECTION=sqlite\nDB_DATABASE=/var/www/html/database/database.sqlite\n" \
      "$(php -r 'echo base64_encode(random_bytes(32));')" > .env \
    && touch database/database.sqlite \
    && mkdir -p bootstrap/cache \
    && npm run build \
    && rm .env

# ── Stage 2: PHP-FPM runtime ──────────────────────────────────────────
FROM php:8.4-fpm-alpine AS app
WORKDIR /var/www/html

RUN apk add --no-cache sqlite-dev \
    && docker-php-ext-install pdo_sqlite opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . .
COPY --from=builder /var/www/html/public/build ./public/build

RUN mkdir -p database storage/app/public \
             storage/framework/cache storage/framework/sessions \
             storage/framework/views storage/logs bootstrap/cache \
    && touch database/database.sqlite \
    && chown -R www-data:www-data storage bootstrap/cache database

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]

# ── Stage 3: Nginx with static assets baked in ────────────────────────
FROM nginx:alpine AS nginx
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
EXPOSE 80
