#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=com.github.youapps.TranslateYou_unofficial /app/share/com.github.youapps.TranslateYou_unofficial.apk $@
