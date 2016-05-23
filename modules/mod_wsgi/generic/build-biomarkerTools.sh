#!/bin/sh

ant -Dname=biomarkerTools \
-Dport=8160 \
-Dapp_root=/analysistools/public_html/apps/biomarkerTools \
-Dwsgi_root=/analysistools/public_html/wsgi/biomarkerTools
