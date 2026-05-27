-- ============================================================
--  WikiSearch — Script de creación de base de datos
--  Ejecutar como superusuario MySQL:
--    mysql -u root -p < setup_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wikipedia_search
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wikipedia_search;

-- ── Tabla principal de historial ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    session_id    VARCHAR(128)    NOT NULL DEFAULT ''       COMMENT 'ID de sesión PHP — permite historial por usuario sin login',
    search_term   VARCHAR(255)    NOT NULL                  COMMENT 'Término introducido por el usuario',
    results_count INT UNSIGNED    NOT NULL DEFAULT 0        COMMENT 'Total de resultados devueltos por Wikipedia',
    searched_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la búsqueda (UTC)',

    PRIMARY KEY (id),
    INDEX idx_session    (session_id, searched_at DESC),
    INDEX idx_search_term (search_term)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── Migraciones para instalaciones existentes ────────────────────────────────
-- Ejecutar solo si la BD ya estaba creada con una versión anterior:
--
-- 1. Ampliar results_count (si se creó como SMALLINT):
-- ALTER TABLE search_history
--     MODIFY COLUMN results_count INT UNSIGNED NOT NULL DEFAULT 0
--     COMMENT 'Total de resultados devueltos por Wikipedia';
--
-- 2. Añadir columna session_id (si no existe ya):
-- ALTER TABLE search_history
--     ADD COLUMN session_id VARCHAR(128) NOT NULL DEFAULT '' COMMENT 'ID de sesión PHP' AFTER id,
--     ADD INDEX idx_session (session_id, searched_at DESC);

-- ── Usuario de aplicación (opcional, recomendado en producción) ───────────────
-- Crea un usuario con permisos mínimos solo sobre esta base de datos.
-- Descomenta y ajusta si lo necesitas:
--
-- CREATE USER IF NOT EXISTS 'wikisearch_app'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';
-- GRANT SELECT, INSERT, DELETE ON wikipedia_search.* TO 'wikisearch_app'@'localhost';
-- FLUSH PRIVILEGES;
