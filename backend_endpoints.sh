#!/bin/bash
echo "=== Backend Endpoints ==="
grep -rE '@(Get|Post|Patch|Delete|Put)\(' backend/src/modules/ | awk -F':' '{print $2}' | sed -E 's/^[ \t]+//' | sort | uniq
echo "=== Controllers ==="
grep -rE '@Controller\(' backend/src/modules/ | awk -F':' '{print $2}' | sed -E 's/^[ \t]+//' | sort | uniq
