#!/usr/bin/sh

# Example values 
# apc_root  = /analysistools/public_html/apps/apc
# wsgi_root = /analysistools/public_html/wsgi/apc
# port      = 8040

mod_wsgi-express setup-server @apc_root@/apc.wsgi \
--port @port@ \
--user apache \
--group apache \
--server-root @wsgi_root@ \
--working-directory @apc_root@ \
--error-log-name apc.log
