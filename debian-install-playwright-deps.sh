#!/bin/bash

# Minimal Debian/Ubuntu Playwright Dependencies Installer
# Installs only the essential dependencies that Playwright explicitly requires

set -e

echo "🎭 Playwright Minimal Dependencies for Debian/Ubuntu"
echo "====================================================="
echo ""
echo "Installing only the essential dependencies listed by Playwright..."
echo ""

# Debian equivalents of the Fedora packages
sudo apt-get update
sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libatspi2.0-0 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libcairo2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libasound2

echo ""
echo "✅ Essential dependencies installed!"
echo ""
echo "If Playwright needs additional libraries later, it will show"
echo "specific error messages about what's missing."
echo ""
echo "🎭 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. The Playwright MCP should now work with Chromium headless"
