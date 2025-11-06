#!/bin/sh
set -e

echo "Starting AGIStack..."

# Start all services with PM2
# Note: Control plane handles database migrations on startup
pm2-runtime start ecosystem.config.js
