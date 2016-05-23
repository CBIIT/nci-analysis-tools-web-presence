#!/bin/sh

ant -Dname=pathway \
-Dport=8190 \
-Dapp_root=/analysistools/public_html/apps/pathway \
-Dwsgi_root=/analysistools/public_html/wsgi/pathway
