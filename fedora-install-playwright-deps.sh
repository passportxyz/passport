#!/bin/bash

# Minimal Fedora/RHEL Playwright Dependencies Installer
# Installs only the essential dependencies that Playwright explicitly requires

set -e

echo "🎭 Playwright Minimal Dependencies for Fedora/RHEL"
echo "==================================================="
echo ""
echo "Installing only the essential dependencies listed by Playwright..."
echo ""

# Install exactly what Playwright asked for
sudo dnf install -y \
  nspr \
  nss \
  dbus-libs \
  atk \
  at-spi2-atk \
  cups-libs \
  at-spi2-core \
  libXcomposite \
  libXdamage \
  libXext \
  libXfixes \
  libXrandr \
  mesa-libgbm \
  cairo \
  pango \
  alsa-lib

echo ""
echo "✅ Essential dependencies installed!"
echo ""
echo "If Playwright needs additional libraries later, it will show"
echo "specific error messages about what's missing."
echo ""
echo "🎭 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. The Playwright MCP should now work with Chromium headless"