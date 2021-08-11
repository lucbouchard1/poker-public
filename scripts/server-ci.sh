#!/bin/bash
set -eu
set -o pipefail

cd server
mkdir -p key
echo "{}" > key/admin-auth-key.json
npm install
npm run build
npm test
npm run lint
