#!/bin/sh
export ATL_UGLY_ENABLE_WEBVIEW=
exec android-translation-layer --gapplication-app-id=net.newpipe.NewPipe_unofficial /app/share/net.newpipe.NewPipe_unofficial.apk $@
