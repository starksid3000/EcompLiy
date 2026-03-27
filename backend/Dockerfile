FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (using npm install as npm ci might require package-lock.json to be perfectly in sync)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the NestJS application
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start the application (running migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/main.js 2>/dev/null || node dist/src/main.js)"]
