# ═══════════════════════════════════════════════════
# Dockerfile — SkyBook Flight Booking App
# ═══════════════════════════════════════════════════
#
# This file tells Docker HOW to build a container for our app.
# Think of it as a recipe: "Start with Node.js, copy my code, run it."
#
# To build:  docker build -t skybook .
# To run:    docker run -p 3000:3000 skybook
# Or simply: docker-compose up
#

# ── STEP 1: Start from a base image ──
# node:20-alpine = a lightweight Linux with Node.js 20 pre-installed
# "alpine" means minimal size (~50MB vs ~350MB for full)
FROM node:20-alpine

# ── STEP 2: Set the working directory inside the container ──
# All following commands will run from /app
WORKDIR /app

# ── STEP 3: Copy package.json first (for caching) ──
# Docker caches each step. If package.json hasn't changed,
# it won't re-run "npm install" — saves time on rebuilds!
COPY module-2/package.json module-2/package-lock.json* ./module-2/

# ── STEP 4: Install dependencies ──
WORKDIR /app/module-2
RUN npm install --production

# ── STEP 5: Copy the rest of the code ──
WORKDIR /app
COPY module-2/server.js ./module-2/
COPY module-2/db.js ./module-2/
COPY app/ ./app/

# ── STEP 6: Expose the port ──
# This tells Docker that the container listens on port 3000
# (doesn't actually open it — that's done with -p flag)
EXPOSE 3000

# ── STEP 7: Start the server ──
# This command runs when the container starts
WORKDIR /app/module-2
CMD ["node", "server.js"]
