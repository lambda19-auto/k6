#!/usr/bin/env bash

set -e

set -a
source .env
set +a

k6 run "tests/$1.js"