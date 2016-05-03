#!/usr/bin/sh

APPS_ROOT=/analysistools/public_html/apps/apc
WSGI_ROOT=/analysistools/public_html/wsgi/apc
APC_PORT=8040

mod_wsgi-express setup-server $APPS_ROOT/apc/apc.wsgi \
--port $APC_PORT \
--user apache \
--group apache \
--server-root $WSGI_ROOT/apc \
--working-directory $APPS_ROOT/apc \
--error-log-name apc.log
