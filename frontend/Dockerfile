FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Run dev server (no hot reload issues in container)
CMD ["npm", "run", "dev"]
