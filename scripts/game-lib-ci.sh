#!/bin/bash
set -eu
set -o pipefail

cd game

npm install
npm run build
npm test
npm run lint