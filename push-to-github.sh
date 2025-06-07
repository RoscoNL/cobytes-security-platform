#!/bin/bash

# Push to GitHub script for cobytes-security-platform

echo "Pushing to GitHub repository: RoscoNL/cobytes-security-platform"
echo "Current branch: $(git branch --show-current)"

# Push to origin
git push -u origin main

echo "Push completed!"
echo ""
echo "Repository URL: https://github.com/RoscoNL/cobytes-security-platform"
echo ""
echo "If this is the first push, you may need to authenticate with GitHub."
echo "Use your GitHub username and a personal access token (not your password)."