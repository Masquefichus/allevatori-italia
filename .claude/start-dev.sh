#!/bin/bash
unset VIRTUAL_ENV
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/amadiscleva/Documents/Stock/allevatori-italia
exec node node_modules/.bin/next dev --port ${PORT:-3001}
