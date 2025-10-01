# Environment Configuration Examples

This directory contains example environment configuration files for different deployment environments.

## Files

- **`.env.netcash.example`** - Netcash payment integration configuration
- **`.env.production.example`** - Production environment variables
- **`.env.staging.example`** - Staging environment variables

## Usage

1. Copy the appropriate example file to the project root
2. Rename it to match your environment:
   - `.env` for development
   - `.env.local` for local overrides
   - `.env.production` for production builds
   - `.env.staging` for staging builds

3. Fill in your actual API keys and secrets (never commit these!)

## Main Environment File

The primary `.env.example` file remains in the project root for quick reference and setup.

## Security

⚠️ **Never commit files containing actual secrets!**
- All `.env` files (except `.env.example`) are gitignored
- Use environment variables in your deployment platform (Vercel, etc.)
- Store sensitive credentials in secure vaults (not in code)
