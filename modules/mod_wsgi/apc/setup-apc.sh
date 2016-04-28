#!/usr/bin/sh

APC_ROOT=/analysistools/public_html/apps/apc
APC_WSGI_ROOT=/analysistools/public_html/wsgi/apc

mod_wsgi-express setup-server $APC_ROOT/apc.wsgi \
--port 8040 \
--user apache \
--group apache \
--server-root $APC_WSGI_ROOT \
--working-directory $APC_ROOT \
--error-log-name apc.log
