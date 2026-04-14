SELECT 'CREATE ROLE silkway_user LOGIN PASSWORD ''silkway_local_123'''
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'silkway_user')
\gexec

ALTER ROLE silkway_user WITH PASSWORD 'silkway_local_123';

SELECT 'CREATE DATABASE silkway_db OWNER silkway_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'silkway_db')
\gexec
