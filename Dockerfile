FROM node:22-trixie-slim

# sqlite3 has no linux-arm64 prebuild for node 22; compile it from source
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
