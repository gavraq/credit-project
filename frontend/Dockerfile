# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Build arguments for React environment variables
ARG REACT_APP_API_BASE_URL=http://localhost:8000
ARG REACT_APP_ENVIRONMENT=development

# Set as environment variables for the build
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT

# Copy package files
COPY package*.json ./

# Install all dependencies (need devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

# Change ownership of nginx directories
RUN chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    chown -R app:app /etc/nginx/conf.d && \
    chown -R app:app /usr/share/nginx/html

# Touch pid file and change ownership
RUN touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]