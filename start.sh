#!/bin/bash
set -e

cd server
npm ci
npm run build
node dist/index.js
