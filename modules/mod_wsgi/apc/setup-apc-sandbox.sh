#!/usr/bin/sh
 
mod_wsgi-express setup-server /analysistools-sandbox/public_html/apps/apc/deploy.wsgi \
--port 9040 \
--user apache \
--group apache \ 
--enable-debugger \
--server-root /analysistools-sandbox/public_html/wsgi/apc \
--working-directory /analysistools-sandbox/public_html/apps/apc