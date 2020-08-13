#!/bin/bash -e

#: Description  : Generates scripts to setup, start, and stop a wsgi application using mod_wsgi-express
#: Options      : -n | --name  The name of the application (the .wsgi file should have the same name as the application)
#               : -p | --port  The port this application will be running on
#               : -r | --root  The root directory of this application. This directory has a folder called "app" that contains all application files
#               : -s | --socket-prefix  The socket prefix for this application. If not specified, this will default to the application's wsgi/ folder
#               : -o | --processes  The number of processes
#               : -t | --threads  The number of worker threads per process

APP_NAME=
APP_PORT=
APP_ROOT=
SOCKET_PREFIX=
PROCESSES=
THREADS=

# Parse arguments
while true; do
  case "$1" in
    -n | --name ) APP_NAME="$2"; shift 2 ;;
    -p | --port ) APP_PORT="$2"; shift 2 ;;
    -r | --root ) APP_ROOT="$2"; shift 2 ;;
    -s | --socket-prefix ) SOCKET_PREFIX="$2"; shift 2 ;;
    -o | --processes ) PROCESSES="$2"; shift 2 ;;
    -t | --threads ) THREADS="$2"; shift 2 ;;
    * ) break ;;
  esac
done

if [ "$APP_NAME" ] && [ "$APP_PORT" ] && [ "$APP_ROOT" ]
then

# Use default directory for socket prefix if not specified
if [ -z "$SOCKET_PREFIX" ]; then
  SOCKET_PREFIX=$APP_ROOT/wsgi/
fi

# Use default value for processes if not specified
if [ -z "$PROCESSES" ]; then
  PROCESSES=3
fi

# Use default value for threads if not specified
if [ -z "$THREADS" ]; then
  THREADS=1
fi

# Create socket prefix directory if it does not exist
mkdir -p $SOCKET_PREFIX

# Create app_root if it does not exist
mkdir -p $APP_ROOT/app $APP_ROOT/wsgi $APP_ROOT/logs

# Additional configuration directives
cat << EOF > $APP_ROOT/wsgi/additional-configuration.conf

# Do not serve certain filetypes
<FilesMatch "\.(conf|db|sqlite|ini|py|pyc|wsgi|xml|R|r|md|yml|yaml)$|\.git">
  Require all denied
</FilesMatch>

<IfModule mod_headers.c> 
	Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
	Header set X-Frame-Options "SAMEORIGIN"
	Header set Referrer-Policy "no-referrer-when-downgrade"
	Header set X-XSS-Protection "1; mode=block"
	Header set Content-Security-Policy "default-src https: http: data:;"
	Header set Expect-CT "max-age=31536000"
</IfModule>

# Workaround for process timeout
WSGIApplicationGroup %{GLOBAL}
WSGISocketPrefix $SOCKET_PREFIX

EOF


# Create setup-<app>.sh
cat << EOF > $APP_ROOT/setup-$APP_NAME.sh
#!/bin/bash

mod_wsgi-express setup-server $APP_ROOT/app/$APP_NAME.wsgi \\
--port $APP_PORT \\
--server-root $APP_ROOT/wsgi \\
--document-root $APP_ROOT/app \\
--working-directory $APP_ROOT/app \\
--directory-index index.html \\
--log-directory $APP_ROOT/logs \\
--rotate-logs \\
--error-log-name $APP_NAME.log \\
--include-file $APP_ROOT/wsgi/additional-configuration.conf \\
--header-buffer-size 50000000 \\
--response-buffer-size 50000000 \\
--limit-request-body 5368709120 \\
--initial-workers 1 \\
--socket-timeout 900 \\
--queue-timeout 900 \\
--shutdown-timeout 900 \\
--graceful-timeout 900 \\
--connect-timeout 900 \\
--request-timeout 900 \\
--processes $PROCESSES \\
--threads $THREADS \\
--reload-on-changes
EOF


# Create start-<app>.sh
cat << EOF > $APP_ROOT/start-$APP_NAME.sh
#!/bin/bash

. $APP_ROOT/wsgi/apachectl start
EOF


# Create stop-<app>.sh
cat << EOF > $APP_ROOT/stop-$APP_NAME.sh
#!/bin/bash

pkill -f $APP_ROOT
. $APP_ROOT/wsgi/apachectl stop
EOF

chmod 755 $APP_ROOT/setup-$APP_NAME.sh
chmod 755 $APP_ROOT/start-$APP_NAME.sh
chmod 755 $APP_ROOT/stop-$APP_NAME.sh

else
echo Please provide parameters in the following format:
echo ./build.sh --name app_name --port 0000 --root /path/to/app/root --socket-prefix /optional/path/to/socket/prefix --processes 4 --threads 1
echo
echo This script will generate three folders in the specified directory:
echo   /app  - Contains application files
echo   /wsgi - Contains wsgi configuration files
echo   /logs - Contains log files

fi
