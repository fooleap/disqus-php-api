FROM php:7.1-fpm

# Install application dependencies
RUN curl https://getcaddy.com | bash -s personal \
    && /usr/local/bin/caddy -version \
    && docker-php-ext-install mbstring pdo pdo_mysql

COPY . /srv/app
COPY Caddyfile /etc/Caddyfile

WORKDIR /srv/app/
RUN chown -R www-data:www-data /srv/app

EXPOSE 443
CMD ["/usr/local/bin/caddy", "--conf", "/etc/Caddyfile", "--log", "stdout"]