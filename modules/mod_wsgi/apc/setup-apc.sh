#!/usr/bin/sh

APPLICATION_ROOT=/analysistools/public_html/apps/apc
SERVER_ROOT=/analysistools/public_html/wsgi/apc

mod_wsgi-express setup-server $APPLICATION_ROOT/apc.wsgi \
--port 8040 \
--user apache \
--group apache \ 
--server-root $SERVER_ROOT \
--working-directory $APPLICATION_ROOT