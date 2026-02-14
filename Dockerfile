# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm install --omit=dev

# Set environment variables
ENV NODE_ENV=production

# Run the server
CMD ["node", "dist/index.js"]
