#!/usr/bin/env bash
# Build Next.js with increased memory for large site
cd /home/circletel
echo "Memory available: $(free -m | grep Mem | awk '{print $2}') MB"
export NODE_OPTIONS="--max-old-space-size=4096"
npx next build 2>&1
BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  echo "BUILD SUCCESS"
  echo "Building Docker image..."
  docker build -t ghcr.io/jdeweedata/circletel:staging . 2>&1
  DOCKER_EXIT=$?
  if [ $DOCKER_EXIT -eq 0 ]; then
    echo "Pushing to ghcr..."
    docker push ghcr.io/jdeweedata/circletel:staging 2>&1
  else
    echo "Docker build failed (exit $DOCKER_EXIT)"
  fi
else
  echo "Next.js build failed (exit $BUILD_EXIT)"
fi
