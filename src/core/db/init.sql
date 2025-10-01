CREATE TABLE IF NOT EXISTS videos (
    id         SERIAL PRIMARY KEY,
    url        VARCHAR NOT NULL,
    name       VARCHAR(50) NOT NULL,
    created_at TIMESTAMP
);