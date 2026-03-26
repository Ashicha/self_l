-- ═══════════════════════════════════════════════════
-- SkyBook Database — Initial Schema & Seed Data
-- ═══════════════════════════════════════════════════
-- This file runs automatically when PostgreSQL starts
-- for the first time (docker-entrypoint-initdb.d).

-- ── AIRPORTS TABLE ──
CREATE TABLE airports (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL
);

-- ── FLIGHTS TABLE ──
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL REFERENCES airports(code),
    dest VARCHAR(3) NOT NULL REFERENCES airports(code),
    depart_time VARCHAR(5) NOT NULL,
    arrive_time VARCHAR(5) NOT NULL,
    price INTEGER NOT NULL,
    cabin_class VARCHAR(20) NOT NULL DEFAULT 'Economy',
    seats_left INTEGER NOT NULL DEFAULT 0
);

-- ── PROMO CODES TABLE ──
CREATE TABLE promo_codes (
    code VARCHAR(20) PRIMARY KEY,
    discount DECIMAL(3,2) NOT NULL,
    description VARCHAR(100) NOT NULL,
    min_price INTEGER NOT NULL DEFAULT 0
);

-- ── HELD SEATS TABLE ──
CREATE TABLE held_seats (
    id SERIAL PRIMARY KEY,
    flight_id INTEGER NOT NULL REFERENCES flights(id),
    seat_number VARCHAR(4) NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    held_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(flight_id, seat_number)
);

-- ── BOOKINGS TABLE ──
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    pnr VARCHAR(6) NOT NULL UNIQUE,
    flight_id INTEGER NOT NULL REFERENCES flights(id),
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    depart_time VARCHAR(5) NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    seat_number VARCHAR(4) NOT NULL,
    original_price INTEGER NOT NULL,
    final_price INTEGER NOT NULL,
    promo_code VARCHAR(20),
    promo_description VARCHAR(100),
    promo_discount_amount INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    booked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- SEED DATA — Same data as our in-memory arrays
-- ═══════════════════════════════════════════════════

-- Airports
INSERT INTO airports (code, name, city, country) VALUES
    ('BKK', 'Suvarnabhumi', 'Bangkok', 'Thailand'),
    ('DMK', 'Don Mueang', 'Bangkok', 'Thailand'),
    ('CNX', 'Chiang Mai', 'Chiang Mai', 'Thailand'),
    ('HKT', 'Phuket', 'Phuket', 'Thailand'),
    ('USM', 'Samui', 'Koh Samui', 'Thailand'),
    ('CEI', 'Mae Fah Luang', 'Chiang Rai', 'Thailand'),
    ('NRT', 'Narita', 'Tokyo', 'Japan'),
    ('HND', 'Haneda', 'Tokyo', 'Japan'),
    ('KIX', 'Kansai', 'Osaka', 'Japan'),
    ('FUK', 'Fukuoka', 'Fukuoka', 'Japan'),
    ('ICN', 'Incheon', 'Seoul', 'South Korea'),
    ('GMP', 'Gimpo', 'Seoul', 'South Korea'),
    ('SIN', 'Changi', 'Singapore', 'Singapore'),
    ('HKG', 'Hong Kong', 'Hong Kong', 'Hong Kong'),
    ('TPE', 'Taoyuan', 'Taipei', 'Taiwan'),
    ('KUL', 'KLIA', 'Kuala Lumpur', 'Malaysia'),
    ('SYD', 'Kingsford Smith', 'Sydney', 'Australia'),
    ('LHR', 'Heathrow', 'London', 'United Kingdom'),
    ('JFK', 'John F. Kennedy', 'New York', 'United States'),
    ('LAX', 'Los Angeles', 'Los Angeles', 'United States'),
    ('DXB', 'Dubai', 'Dubai', 'UAE');

-- Flights
INSERT INTO flights (flight_number, origin, dest, depart_time, arrive_time, price, cabin_class, seats_left) VALUES
    ('TG601', 'BKK', 'NRT', '07:30', '15:45', 12500, 'Economy', 23),
    ('TG603', 'BKK', 'NRT', '10:15', '18:30', 18900, 'Economy', 5),
    ('JL708', 'BKK', 'NRT', '13:00', '21:10', 15200, 'Economy', 0),
    ('TG659', 'BKK', 'NRT', '22:00', '06:15', 28500, 'Business', 8),
    ('NH848', 'BKK', 'HND', '01:00', '09:00', 14200, 'Economy', 12),
    ('TG600', 'NRT', 'BKK', '17:00', '22:30', 11800, 'Economy', 31),
    ('SQ978', 'BKK', 'SIN', '08:45', '12:15', 6500, 'Economy', 45),
    ('CX700', 'BKK', 'HKG', '06:00', '09:50', 8200, 'Economy', 0),
    ('TG632', 'BKK', 'ICN', '09:00', '16:30', 13800, 'Economy', 17),
    ('KE660', 'BKK', 'ICN', '23:50', '07:20', 10500, 'Economy', 2);

-- Promo Codes
INSERT INTO promo_codes (code, discount, description, min_price) VALUES
    ('SAVE10', 0.10, '10% off', 5000),
    ('FLY20', 0.20, '20% off', 10000),
    ('WELCOME', 0.05, '5% off — Welcome!', 0),
    ('TESTFREE', 1.00, '100% off (test only)', 0);
