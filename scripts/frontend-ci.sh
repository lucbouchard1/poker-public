#!/bin/bash
set -eu
set -o pipefail

npm install
npm run build
# npm test 
# npm run lint