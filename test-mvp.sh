#!/bin/bash

# Test the MVP with different ideas

echo "Testing LaunchLens MVP..."
echo "========================="
echo ""

# Test 1: Saturated market idea
echo "Test 1: AI form builder (saturated market)"
curl -s -X POST http://localhost:3003/api/validate \
  -H "Content-Type: application/json" \
  -d '{"idea": "AI-powered form builder for small businesses"}' \
  | python3 -m json.tool | grep -E '"decision"|"reasons"' | head -5
echo ""

# Test 2: Niche idea
echo "Test 2: Niche B2B tool"
curl -s -X POST http://localhost:3003/api/validate \
  -H "Content-Type: application/json" \
  -d '{"idea": "Compliance tracking tool for dental practices to manage HIPAA requirements"}' \
  | python3 -m json.tool | grep -E '"decision"|"reasons"' | head -5
echo ""

# Test 3: Original AI token idea
echo "Test 3: AI token organizer"
curl -s -X POST http://localhost:3003/api/validate \
  -H "Content-Type: application/json" \
  -d '{"idea": "AI token usage tracker for developers to monitor API costs across multiple providers"}' \
  | python3 -m json.tool | grep -E '"decision"|"reasons"' | head -5
echo ""

echo "Done!"