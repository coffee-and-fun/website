#!/bin/zsh
set -euo pipefail
TASK_ROOT="${0:A:h:h}"
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
xcodebuild -project "$TASK_ROOT/Stillkeys.xcodeproj" -scheme Stillkeys -configuration Debug \
  -derivedDataPath "$TASK_ROOT/DerivedData" CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual build
"$TASK_ROOT/DerivedData/Build/Products/Debug/Stillkeys.app/Contents/MacOS/Stillkeys" --export-screenshots
TASK_CAPTURE_DIR="$HOME/Library/Containers/com.coffeeandfun.stillkeys/Data/Documents/Stillkeys-Screenshots"
cp "$TASK_CAPTURE_DIR"/*.png "$TASK_ROOT/Store/Screenshots/"
python3 "$TASK_ROOT/Scripts/validate-store.py"
