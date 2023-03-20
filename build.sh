#!/bin/bash
set -ex
# Build the project
npx next build
# export the project
npx next export
# copy custom scripts to out
cp -r server.js socket.js out/
# success
echo "Build complete"
