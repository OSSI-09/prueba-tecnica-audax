FROM php:8.2-apache

# Instala la extensión mysqli
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Habilita mod_rewrite para .htaccess
RUN a2enmod rewrite

# Permite .htaccess en el DocumentRoot
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

WORKDIR /var/www/html
