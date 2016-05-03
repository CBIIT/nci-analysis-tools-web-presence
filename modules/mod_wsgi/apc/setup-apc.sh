#!/usr/bin/sh

APPS_ROOT=/analysistools/public_html/apps/apc
WSGI_ROOT=/analysistools/public_html/wsgi/apc

mod_wsgi-express setup-server $APPS_ROOT/apc/apc.wsgi \
--port 8040 \
--user apache \
--group apache \
--server-root $WSGI_ROOT/apc \
--working-directory $APPS_ROOT/apc \
--error-log-name apc.log
