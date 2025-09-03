#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=com.github.DavidVentura.offlinetranslate_unofficial /app/share/com.github.DavidVentura.offlinetranslate_unofficial.apk $@
