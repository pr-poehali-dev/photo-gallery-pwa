CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    camera TEXT,
    lens TEXT,
    iso TEXT,
    aperture TEXT,
    shutter TEXT,
    photo_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);