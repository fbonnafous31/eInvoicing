#!/bin/bash

echo "🔧 Fixing vulnerabilities in backend..."
cd backend
npm audit fix
BACKEND_STATUS=$?
cd ..

echo ""

echo "🔧 Fixing vulnerabilities in frontend..."
cd frontend
npm audit fix
FRONTEND_STATUS=$?
cd ..

echo ""
echo "==================== RESULTS ===================="

if [ $BACKEND_STATUS -eq 0 ]; then
  echo "✅ Backend: fixes applied or nothing to fix"
else
  echo "⚠️ Backend: some issues may still remain"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
  echo "✅ Frontend: fixes applied or nothing to fix"
else
  echo "⚠️ Frontend: some issues may still remain"
fi

echo "================================================="
echo ""
echo "👉 If issues remain, try manually:"
echo "   - backend :  cd backend && npm audit fix --force"
echo "   - frontend:  cd frontend && npm audit fix --force"
echo ""
echo "⚠️ Note: --force can introduce breaking changes."
