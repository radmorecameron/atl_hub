#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=com.gitlab.ngrob.bluemoon_unofficial /app/share/com.gitlab.ngrob.bluemoon_unofficial.apk $@
