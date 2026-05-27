# WikiSearch

Aplicación web sencilla para buscar términos en Wikipedia y guardar el historial de búsquedas en una base de datos MySQL.

## Tecnologías usadas

- HTML5
- CSS3
- JavaScript
- PHP
- MySQL
- API pública de Wikipedia

## Estructura

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── api/
│   ├── db_config.php
│   ├── save_search.php
│   ├── get_history.php
│   ├── clear_history.php
│   └── .htaccess
└── setup_db.sql
```

## Funcionamiento

El usuario escribe un término en el buscador. JavaScript captura el envío del formulario, consulta la API de Wikipedia y muestra los resultados en la misma página.

Después de cada búsqueda, se envía el término al backend PHP para guardarlo en la tabla `search_history`. El historial se carga desde la base de datos y se muestra en el lateral.

## Base de datos

Antes de usar la aplicación hay que crear la base de datos ejecutando:

```bash
mysql -u root -p < setup_db.sql
```

El archivo `setup_db.sql` crea la base de datos `wikipedia_search` y la tabla `search_history`.

## Configuración

La conexión a la base de datos se configura en:

```text
api/db_config.php
```

Por defecto usa estos valores:

```php
DB_HOST = localhost
DB_USER = root
DB_PASS =
DB_NAME = wikipedia_search
```

Si se usa otro usuario o contraseña de MySQL, hay que cambiar esos valores.

## Cómo ejecutarlo

**Con Docker:**

```bash
docker compose up --build
```

**Sin Docker** (requiere PHP y MySQL instalados):

```bash
mysql -u root -p < setup_db.sql
php -S localhost:8080
```

Abrir `http://localhost:8080` en el navegador.

## Seguridad

El historial se guarda usando consultas preparadas en PHP para evitar inyecciones SQL.

También se escapan los textos antes de insertarlos en la página para reducir el riesgo de XSS.