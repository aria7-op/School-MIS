#!/bin/bash

echo "🚀 Rebuilding production bundle with encryption middleware..."

# Run the production build script
npm run build:prod

echo "✅ Production bundle rebuilt!"
echo "📁 Check the dist/ directory for the new bundle"
echo "🔄 Restart your server to use the updated version" 