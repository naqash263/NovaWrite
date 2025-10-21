#!/bin/bash

# This script triggers the run-cv-seeder.yml workflow on GitHub

# You need to have a GitHub personal access token with workflow permissions
# Set it as an environment variable GITHUB_TOKEN or pass it as the first argument
TOKEN=${1:-$GITHUB_TOKEN}

if [ -z "$TOKEN" ]; then
  echo "Error: GitHub token is required"
  echo "Usage: $0 <github_token>"
  exit 1
fi

# Repository information
OWNER="naqash263"
REPO="NovaWrite"
WORKFLOW_ID="run-cv-seeder.yml"

# Trigger the workflow
echo "Triggering CV template seeder workflow..."
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/workflows/$WORKFLOW_ID/dispatches" \
  -d '{"ref":"main"}'

echo -e "\nWorkflow triggered! Check the Actions tab in your GitHub repository to monitor progress."
echo "https://github.com/$OWNER/$REPO/actions"
