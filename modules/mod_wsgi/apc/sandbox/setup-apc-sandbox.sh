#!/usr/bin/sh

APC_ROOT=/analysistools-sandbox/public_html/apps/apc
APC_WSGI_ROOT=/analysistools-sandbox/public_html/wsgi/apc

mod_wsgi-express setup-server $APC_ROOT/apc.wsgi \
--port 9040 \
--user apache \
--group apache \ 
--enable-debugger \
--server-root $APC_WSGI_ROOT \
--working-directory $APC_ROOT/apc