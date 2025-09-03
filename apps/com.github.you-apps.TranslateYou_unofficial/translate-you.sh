#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=com.github.you-apps.TranslateYou_unofficial /app/share/com.github.you-apps.TranslateYou_unofficial.apk $@
