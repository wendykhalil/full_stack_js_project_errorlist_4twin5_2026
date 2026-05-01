#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Start Jenkins and print setup instructions
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "🚀 Starting Jenkins..."
docker-compose -f docker-compose.jenkins.yml up -d

echo ""
echo "⏳ Waiting for Jenkins to start (30 seconds)..."
sleep 30

echo ""
echo "🔑 Getting initial admin password..."
PASS=$(docker exec bmp-jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null)
if [ -n "$PASS" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════╗"
  echo "  Jenkins is ready!"
  echo ""
  echo "  URL      : http://localhost:8080"
  echo "  Password : $PASS"
  echo "╚══════════════════════════════════════════════════╝"
else
  echo "Jenkins is starting... run this to get the password:"
  echo "  docker exec bmp-jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
fi
