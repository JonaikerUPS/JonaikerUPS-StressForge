#!/bin/sh
echo "GET http://nginx.org" | vegeta attack -duration=3s | vegeta report
