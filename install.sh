#!/bin/bash

# Passport SDK Installation Script
# Sets up development environment with all dependencies

set -e

echo "🚀 Passport SDK Development Setup"
echo "=================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install Yarn if not present
if ! command -v yarn &> /dev/null; then
    echo ""
    echo "📦 Installing Yarn package manager..."
    sudo npm install -g yarn
    echo "✅ Yarn installed: $(yarn --version)"
else
    echo "✅ Yarn is already installed: $(yarn --version)"
fi

# Install project dependencies (includes dev via postinstall)
echo ""
echo "📦 Installing all dependencies..."
yarn install

# Check if running on Fedora/RHEL and offer to install Playwright deps
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "fedora" ]] || [[ "$ID" == "rhel" ]]; then
        echo ""
        echo "🎭 Detected Fedora/RHEL system"
        read -p "Would you like to install Playwright browser dependencies? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f ./fedora-install-playwright-deps.sh ]; then
                ./fedora-install-playwright-deps.sh
            else
                echo "⚠️  fedora-install-playwright-deps.sh not found"
            fi
        fi
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Build the SDK: yarn build"
echo "   2. Start dev with mocks: yarn dev:mock"
echo "   3. Or start dev with real API: yarn dev:real"
echo ""
echo "📚 For more information, see README.md"
