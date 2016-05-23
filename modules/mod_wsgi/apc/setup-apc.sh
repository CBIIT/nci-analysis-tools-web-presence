#!/bin/sh

# Example values:
# ant 	-Dport=8040 \
# 		-Dapc_root=/analysistools/public_html/apps/apc \
#		-Dwsgi_root=/analysistools/public_html/wsgi/apc \
#		replace

mod_wsgi-express setup-server @apc_root@/apc.wsgi \
--port @port@ \
--user apache \
--group apache \
--server-root @wsgi_root@ \
--working-directory @apc_root@ \
--error-log-name apc.log
