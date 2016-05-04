#!/usr/bin/sh

APPS_ROOT=/analysistools-sandbox/public_html/apps
WSGI_ROOT=/analysistools-sandbox/public_html/wsgi

mod_wsgi-express setup-server $APPS_ROOT/apc/apc.wsgi \
--port 9040 \
--user apache \
--group apache \
--enable-debugger \
--server-root $WSGI_ROOT/apc \
--working-directory $APPS_ROOT/apc \
--error-log-name apc-sandbox.log
