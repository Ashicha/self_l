// ============================================================
// MODULE 2 — LESSON 1: Your First Server
// ============================================================
//
// 🔄 FLOWCHART MAPPING:
// Your flowchart shows arrows like:
//   GET /api/flights?origin=BKK&dest=NRT
//   POST /api/seats/hold
//   POST /api/promos/validate
//
// WHO handles these requests? → A SERVER (this file!)
//
// In Module 1, we built the FRONTEND (what the user sees).
// Now we build the BACKEND (the brain that processes requests).
//
// ============================================================
//
// HOW TO RUN THIS FILE:
//   1. Open a terminal in the module-2 folder
//   2. Run: npm install
//   3. Run: npm start
//   4. Open browser: http://localhost:3000
//
// ============================================================

// ── STEP 1: Import Express ──
// Express is a LIBRARY (someone else's code we reuse).
// It handles the hard parts of building a server for us.
// Think of it like: "I don't build my own car, I use Toyota."
const express = require("express");
const path = require("path");
const db = require("./db");

// ── STEP 2: Create the app ──
// This creates your server application.
// Think of it as: "Build a new restaurant."
const app = express();

// ── Serve the SkyBook web app ──
// This makes the `app/` folder accessible at http://localhost:3000/app/
// express.static() serves HTML, CSS, JS files directly — like a real website!
app.use("/app", express.static(path.join(__dirname, "..", "app")));

// ── STEP 3: Tell Express to understand JSON ──
// When the frontend sends data (like a booking form),
// it sends it as JSON. This line lets Express read it.
app.use(express.json());

// ── STEP 4: Enable CORS ──
// CORS = Cross-Origin Resource Sharing
// This allows our Module 1 HTML pages to talk to this server.
// Without it, the browser blocks the connection (security feature).
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  DATABASE — Now powered by PostgreSQL!                     ║
// ╚═══════════════════════════════════════════════════════════╝
//
// Previously: data lived in JavaScript arrays (lost on restart)
// Now: data lives in PostgreSQL tables (persists forever!)
//
// Old way:  const flight = flights.find(f => f.id === 1)
// New way:  const result = await db.query("SELECT * FROM flights WHERE id = $1", [1])
//
// See db/init.sql for the table schemas and seed data.
// See module-2/db.js for the connection pool setup.

// ╔═══════════════════════════════════════════════════════════╗
// ║  ROUTES (API Endpoints) — The heart of your server        ║
// ╚═══════════════════════════════════════════════════════════╝
//
// Each route = one arrow in your flowchart.
// Pattern: app.METHOD(PATH, HANDLER)
//   - METHOD  = get, post, put, delete  (HTTP methods you learned in Module 1)
//   - PATH    = the URL endpoint, like "/api/flights"
//   - HANDLER = a function that runs when someone visits that URL

// ── ROUTE 1: Home page ──
// When someone visits http://localhost:3000/
// This is just a welcome page to confirm the server is running.
app.get("/", (req, res) => {
  // req = the REQUEST  (what the client sent us)
  // res = the RESPONSE (what we send back)
  res.json({
    message: "✈️ Flight Booking API is running!",
    version: "1.0.0",
    endpoints: {
      searchFlights: "GET /api/flights?origin=BKK&dest=NRT",
      getFlightById: "GET /api/flights/:id",
      getAirports: "GET /api/airports",
      healthCheck: "GET /api/health",
    },
  });
});

// ── ROUTE 2: GET /api/flights — Search flights ──
// 🔄 FLOWCHART: "GET /api/flights?origin=BKK&dest=NRT&date=2026-04-01&flightType=one-way"
// This is the FIRST API call in your flowchart!
//
// How it works:
//   1. Frontend sends: GET /api/flights?origin=BKK&dest=NRT
//   2. Server receives: req.query = { origin: "BKK", dest: "NRT" }
//   3. Server filters the flights array
//   4. Server sends back the matching flights as JSON
app.get("/api/flights", async (req, res) => {
  const { origin, dest } = req.query;

  if (!origin || !dest) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Please provide both 'origin' and 'dest' query parameters",
      example: "/api/flights?origin=BKK&dest=NRT",
    });
  }

  const originUpper = origin.toUpperCase();
  const destUpper = dest.toUpperCase();

  // Validate airport codes against the airports TABLE (not a hardcoded array!)
  const airportCheck = await db.query(
    "SELECT code FROM airports WHERE code = $1 OR code = $2",
    [originUpper, destUpper],
  );
  const validCodes = airportCheck.rows.map((r) => r.code);

  if (!validCodes.includes(originUpper)) {
    return res.status(400).json({
      error: "Invalid origin airport",
      message: `"${originUpper}" is not a valid airport code`,
    });
  }
  if (!validCodes.includes(destUpper)) {
    return res.status(400).json({
      error: "Invalid destination airport",
      message: `"${destUpper}" is not a valid airport code`,
    });
  }

  // Query the REAL database instead of filtering an array
  // Old: flights.filter(f => f.origin === originUpper && f.dest === destUpper)
  // New: SELECT ... FROM flights WHERE origin = $1 AND dest = $2
  const result = await db.query(
    `SELECT id, flight_number AS "flightNumber", origin, dest,
            depart_time AS "departTime", arrive_time AS "arriveTime",
            price, cabin_class AS "cabinClass", seats_left AS "seatsLeft"
     FROM flights
     WHERE origin = $1 AND dest = $2
     ORDER BY depart_time`,
    [originUpper, destUpper],
  );

  res.json({
    count: result.rows.length,
    origin: originUpper,
    destination: destUpper,
    flights: result.rows,
  });
});

// ── ROUTE 3: GET /api/flights/:id — Get one flight ──
// The :id is a URL PARAMETER (different from query parameter)
//   URL: /api/flights/1  → req.params.id = "1"
//   URL: /api/flights/5  → req.params.id = "5"
//
// 🔄 FLOWCHART: "Passenger selected flight" → need to get details
app.get("/api/flights/:id", async (req, res) => {
  const flightId = parseInt(req.params.id, 10);

  const result = await db.query(
    `SELECT id, flight_number AS "flightNumber", origin, dest,
            depart_time AS "departTime", arrive_time AS "arriveTime",
            price, cabin_class AS "cabinClass", seats_left AS "seatsLeft"
     FROM flights WHERE id = $1`,
    [flightId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Flight not found",
      message: `No flight with id ${flightId}`,
    });
  }

  res.json(result.rows[0]);
});

// ── ROUTE 4: GET /api/airports — List valid airports ──
// Useful for the frontend dropdown/validation
app.get("/api/airports", async (req, res) => {
  const result = await db.query("SELECT code FROM airports ORDER BY code");
  const airports = result.rows.map((r) => r.code);
  res.json({
    count: airports.length,
    airports,
  });
});

// ── ROUTE 5: GET /api/health — Health check ──
// Real-world servers always have a /health endpoint.
// Monitoring tools ping this to check if the server is alive.
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
app.get("/api/list", async (req, res) => {
  const result = await db.query(
    `SELECT id, flight_number AS "flightNumber", origin, dest,
            depart_time AS "departTime", arrive_time AS "arriveTime",
            price, cabin_class AS "cabinClass", seats_left AS "seatsLeft"
     FROM flights ORDER BY id`,
  );
  res.json({ flight: result.rows });
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  MODULE 3 — REST API Design: POST Routes                  ║
// ╚═══════════════════════════════════════════════════════════╝
//
// Until now, we only used GET = "read/fetch data"
// Now we add POST = "send data to create/change something"
//
// GET  = "Show me the menu"     (read-only, safe)
// POST = "I want to order this" (changes something on server)
//
// 🔄 FLOWCHART MAPPING:
//   "Passenger selects seats" → POST /api/seats/hold
//   "Apply promo code"        → POST /api/promos/validate
//   "Confirm booking"         → POST /api/bookings

// ── In-memory storage replaced by PostgreSQL tables! ──
// held_seats table  → replaces the heldSeats object
// bookings table    → replaces the bookings array
// promo_codes table → replaces the promoCodes object

// ── ROUTE 6: POST /api/seats/hold ──
app.post("/api/seats/hold", async (req, res) => {
  const { flightId, seatNumber, passengerName } = req.body;

  if (!flightId || !seatNumber || !passengerName) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["flightId", "seatNumber", "passengerName"],
      received: { flightId, seatNumber, passengerName },
    });
  }

  // Check flight exists
  const flightResult = await db.query(
    `SELECT id, flight_number AS "flightNumber", seats_left AS "seatsLeft"
     FROM flights WHERE id = $1`,
    [flightId],
  );
  if (flightResult.rows.length === 0) {
    return res.status(404).json({
      error: "Flight not found",
      message: `No flight with id ${flightId}`,
    });
  }

  const flight = flightResult.rows[0];

  if (flight.seatsLeft <= 0) {
    return res.status(409).json({
      error: "No seats available",
      message: `Flight ${flight.flightNumber} is fully booked`,
      flightId: flight.id,
    });
  }

  // Check if seat already held (using the held_seats TABLE)
  const existingHold = await db.query(
    "SELECT passenger_name FROM held_seats WHERE flight_id = $1 AND seat_number = $2",
    [flightId, seatNumber],
  );
  if (existingHold.rows.length > 0) {
    return res.status(409).json({
      error: "Seat already held",
      message: `Seat ${seatNumber} on flight ${flight.flightNumber} is already held`,
      heldBy: existingHold.rows[0].passenger_name,
    });
  }

  // Hold the seat: INSERT into held_seats + UPDATE flights
  const holdResult = await db.query(
    `INSERT INTO held_seats (flight_id, seat_number, passenger_name)
     VALUES ($1, $2, $3) RETURNING held_at`,
    [flightId, seatNumber, passengerName],
  );
  await db.query(
    "UPDATE flights SET seats_left = seats_left - 1 WHERE id = $1",
    [flightId],
  );

  res.status(201).json({
    success: true,
    message: `Seat ${seatNumber} held for ${passengerName}`,
    hold: {
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      seatNumber,
      passengerName,
      heldAt: holdResult.rows[0].held_at,
    },
  });
});

// ── ROUTE 7: POST /api/promos/validate ──
app.post("/api/promos/validate", async (req, res) => {
  const { code, originalPrice } = req.body;

  if (!code || !originalPrice) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["code", "originalPrice"],
    });
  }

  if (typeof originalPrice !== "number" || originalPrice <= 0) {
    return res.status(400).json({
      error: "Invalid price",
      message: "originalPrice must be a positive number",
    });
  }

  // Look up promo code in the promo_codes TABLE
  const promoResult = await db.query(
    "SELECT code, discount, description, min_price FROM promo_codes WHERE code = $1",
    [code.toUpperCase()],
  );

  if (promoResult.rows.length === 0) {
    return res.json({
      valid: false,
      message: `Promo code "${code}" is not valid`,
    });
  }

  const promo = promoResult.rows[0];

  if (originalPrice < promo.min_price) {
    return res.json({
      valid: false,
      message: `Promo "${code}" requires minimum price of ${promo.min_price} THB`,
    });
  }

  const discountAmount = Math.round(originalPrice * parseFloat(promo.discount));
  const finalPrice = originalPrice - discountAmount;

  res.json({
    valid: true,
    code: promo.code,
    description: promo.description,
    originalPrice,
    discountPercent: parseFloat(promo.discount) * 100,
    discountAmount,
    finalPrice,
  });
});

// ── ROUTE 8: POST /api/bookings ──
app.post("/api/bookings", async (req, res) => {
  const { flightId, passengerName, seatNumber, promoCode } = req.body;

  if (!flightId || !passengerName || !seatNumber) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["flightId", "passengerName", "seatNumber"],
    });
  }

  // Get flight from DB
  const flightResult = await db.query(
    `SELECT id, flight_number, origin, dest, depart_time, price, cabin_class
     FROM flights WHERE id = $1`,
    [flightId],
  );
  if (flightResult.rows.length === 0) {
    return res.status(404).json({ error: "Flight not found" });
  }
  const flight = flightResult.rows[0];

  // Calculate price (with optional promo from DB)
  let finalPrice = flight.price;
  let promoCodeUsed = null;
  let promoDescription = null;
  let promoDiscountAmount = null;

  if (promoCode) {
    const promoResult = await db.query(
      "SELECT code, discount, description, min_price FROM promo_codes WHERE code = $1",
      [promoCode.toUpperCase()],
    );
    if (promoResult.rows.length > 0) {
      const promo = promoResult.rows[0];
      if (flight.price >= promo.min_price) {
        promoDiscountAmount = Math.round(
          flight.price * parseFloat(promo.discount),
        );
        finalPrice = flight.price - promoDiscountAmount;
        promoCodeUsed = promo.code;
        promoDescription = promo.description;
      }
    }
  }

  // Generate unique PNR
  const pnr = await generatePNR();

  // INSERT booking into the bookings TABLE
  const bookingResult = await db.query(
    `INSERT INTO bookings
       (pnr, flight_id, flight_number, origin, destination, depart_time,
        passenger_name, seat_number, original_price, final_price,
        promo_code, promo_description, promo_discount_amount, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'confirmed')
     RETURNING id, pnr, booked_at`,
    [
      pnr,
      flight.id,
      flight.flight_number,
      flight.origin,
      flight.dest,
      flight.depart_time,
      passengerName,
      seatNumber,
      flight.price,
      finalPrice,
      promoCodeUsed,
      promoDescription,
      promoDiscountAmount,
    ],
  );

  const b = bookingResult.rows[0];

  const booking = {
    bookingId: b.id,
    pnr: b.pnr,
    flightId: flight.id,
    flightNumber: flight.flight_number,
    origin: flight.origin,
    destination: flight.dest,
    departTime: flight.depart_time,
    passengerName,
    seatNumber,
    originalPrice: flight.price,
    finalPrice,
    appliedPromo: promoCodeUsed
      ? {
          code: promoCodeUsed,
          description: promoDescription,
          discountAmount: promoDiscountAmount,
        }
      : null,
    status: "confirmed",
    bookedAt: b.booked_at,
  };

  res.status(201).json({
    success: true,
    message: "Booking confirmed!",
    booking,
  });
});

// ── ROUTE 9: GET /api/bookings/:pnr ──
app.get("/api/bookings/:pnr", async (req, res) => {
  const pnr = req.params.pnr.toUpperCase();

  const result = await db.query(
    `SELECT id AS "bookingId", pnr, flight_id AS "flightId",
            flight_number AS "flightNumber", origin, destination,
            depart_time AS "departTime", passenger_name AS "passengerName",
            seat_number AS "seatNumber", original_price AS "originalPrice",
            final_price AS "finalPrice", promo_code, promo_description,
            promo_discount_amount, status, booked_at AS "bookedAt"
     FROM bookings WHERE pnr = $1`,
    [pnr],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Booking not found",
      message: `No booking with PNR "${pnr}"`,
    });
  }

  const row = result.rows[0];
  res.json({
    ...row,
    appliedPromo: row.promo_code
      ? {
          code: row.promo_code,
          description: row.promo_description,
          discountAmount: row.promo_discount_amount,
        }
      : null,
  });
});

// ── Helper: Generate unique PNR (checks DB for uniqueness) ──
async function generatePNR() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Check the bookings TABLE for uniqueness
  const existing = await db.query("SELECT pnr FROM bookings WHERE pnr = $1", [
    pnr,
  ]);
  if (existing.rows.length > 0) {
    return generatePNR();
  }
  return pnr;
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  START THE SERVER                                          ║
// ╚═══════════════════════════════════════════════════════════╝

const PORT = 3000;

app.listen(PORT, async () => {
  console.log("");
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  ✈️  SkyBook — Flight Booking API v3.0 (PostgreSQL)║");
  console.log("╠═══════════════════════════════════════════════════╣");
  console.log(`║  🌐 Web App: http://localhost:${PORT}/app            ║`);
  console.log(`║  📡 API:     http://localhost:${PORT}                ║`);
  console.log("║                                                   ║");
  await db.testConnection();
  console.log("║                                                   ║");
  console.log("║  Press Ctrl+C to stop the server                  ║");
  console.log("╚═══════════════════════════════════════════════════╝");
  console.log("");
});
