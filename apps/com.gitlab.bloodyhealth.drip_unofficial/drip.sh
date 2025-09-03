#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=com.gitlab.bloodyhealth.drip_unofficial /app/share/com.gitlab.bloodyhealth.drip_unofficial.apk $@
