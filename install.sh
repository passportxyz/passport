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

# Install agent-browser CLI for browser automation
if ! command -v agent-browser &> /dev/null; then
    echo ""
    echo "🌐 Installing agent-browser CLI..."
    sudo npm install -g agent-browser
    agent-browser install --with-deps
    echo "✅ agent-browser installed"
else
    echo "✅ agent-browser is already installed"
fi

# Install project dependencies (includes dev via postinstall)
echo ""
echo "📦 Installing all dependencies..."
yarn install

# Check if running on a supported system and offer to install Playwright deps
if [ -f /etc/os-release ]; then
    . /etc/os-release
    PLAYWRIGHT_SCRIPT=""
    if [[ "$ID" == "fedora" ]] || [[ "$ID" == "rhel" ]]; then
        echo ""
        echo "🎭 Detected Fedora/RHEL system"
        PLAYWRIGHT_SCRIPT="./fedora-install-playwright-deps.sh"
    elif [[ "$ID" == "debian" ]] || [[ "$ID" == "ubuntu" ]]; then
        echo ""
        echo "🎭 Detected Debian/Ubuntu system"
        PLAYWRIGHT_SCRIPT="./debian-install-playwright-deps.sh"
    fi
    if [ -n "$PLAYWRIGHT_SCRIPT" ]; then
        read -p "Would you like to install Playwright browser dependencies? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f "$PLAYWRIGHT_SCRIPT" ]; then
                "$PLAYWRIGHT_SCRIPT"
            else
                echo "⚠️  $PLAYWRIGHT_SCRIPT not found"
            fi
        fi
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
