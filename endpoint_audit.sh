#!/bin/bash
echo "=== Frontend Endpoints Expected ==="
grep -roE '(api|this\.api)\.(get|post|patch|delete|put)\([`"'\''][^`"'\''?]+[`"'\'']' frontend/src/services | sed -E 's/.*\.(get|post|patch|delete|put)\([`"'\'']([^`"'\'']+)[`"'\'']/\1 \2/' | sort | uniq
echo "=== Backend Endpoints Defined ==="
grep -rE '@(Get|Post|Patch|Delete|Put)\(' backend/src/modules/ | awk -F':' '{print $1" "$2}' | sed -E 's/.*modules\/([^\/]+)\/.*\.controller\.ts.*@(Get|Post|Patch|Delete|Put)\("?([^"]*)"?\)/\1 \2 \3/' | sort | uniq
