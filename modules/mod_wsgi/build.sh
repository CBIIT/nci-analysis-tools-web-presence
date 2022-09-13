#!/bin/bash -e

#: Description  : Generates scripts to setup, start, and stop a wsgi application using mod_wsgi-express
#: Options      : -n | --name  The name of the application (the .wsgi file should have the same name as the application)
#               : -p | --port  The port this application will be running on
#               : -u | --user  The user this application will be running under (default: ncianalysis)
#               : -g | --group  The group this application will be running under (default: ncianalysis)
#               : -r | --root  The root directory of this application. This directory has a folder called "app" that contains all application files
#               : -s | --socket-prefix  The socket prefix for this application. If not specified, this will default to the application's wsgi/ folder
#               : -o | --processes  The number of processes
#               : -t | --threads  The number of worker threads per process
#               : -l | --logging To enable wsgi logging (default: true)

APP_NAME=
APP_PORT=
APP_ROOT=
APP_USER=ncianalysis
APP_GROUP=ncianalysis
SOCKET_PREFIX=
PROCESSES=
THREADS=
LOGGING=

# Parse arguments
while true; do
  case "$1" in
    -n | --name ) APP_NAME="$2"; shift 2 ;;
    -p | --port ) APP_PORT="$2"; shift 2 ;;
    -u | --user ) APP_USER="$2"; shift 2 ;;
    -g | --group ) APP_GROUP="$2"; shift 2 ;;
    -r | --root ) APP_ROOT="$2"; shift 2 ;;
    -s | --socket-prefix ) SOCKET_PREFIX="$2"; shift 2 ;;
    -o | --processes ) PROCESSES="$2"; shift 2 ;;
    -t | --threads ) THREADS="$2"; shift 2 ;;
    -l | --logging ) LOGGING="$2"; shift 2 ;;
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

# Use default value for logging if not specified
if [ -z "$LOGGING" ]; then
  LOGGING=true
fi

# Use default value for threads if not specified
if [ -z "$THREADS" ]; then
  THREADS=1
fi

# Create socket prefix directory if it does not exist
mkdir -p $SOCKET_PREFIX

if [ $LOGGING = true ]; then
  # Create app_root if it does not exist
  mkdir -p $APP_ROOT/app $APP_ROOT/wsgi $APP_ROOT/logs
else
  mkdir -p $APP_ROOT/app $APP_ROOT/wsgi
fi

# Additional configuration directives
cat << EOF > $APP_ROOT/wsgi/additional-configuration.conf

# Do not serve certain filetypes
<DirectoryMatch "\.git/">
  Require all denied
</DirectoryMatch>

<FilesMatch "\.(conf|db|sqlite|ini|py|pyc|wsgi|xml|R|r|md|yml|yaml|deprecated)$">
  Require all denied
</FilesMatch>

<IfModule mod_headers.c> 
	Header merge Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
	Header merge X-Frame-Options "SAMEORIGIN"
	Header merge Referrer-Policy "no-referrer-when-downgrade"
	Header merge X-XSS-Protection "1; mode=block"
  # todo: implement csp on a tool-by-tool basis
	# Header merge Content-Security-Policy "default-src 'unsafe-eval' 'unsafe-inline' https: http: data:;"
	Header merge Expect-CT "max-age=31536000"
</IfModule>

# Workaround for process timeout
WSGIApplicationGroup %{GLOBAL}
WSGISocketPrefix $SOCKET_PREFIX

EOF

if [ $LOGGING = true ]; then
  # Create setup-<app>.sh with logging
  cat << EOF > $APP_ROOT/setup-$APP_NAME.sh
#!/bin/bash

mod_wsgi-express setup-server $APP_ROOT/app/$APP_NAME.wsgi \\
--user $APP_USER \\
--group $APP_GROUP \\
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
else
  # Create setup-<app>.sh without logging
cat << EOF > $APP_ROOT/setup-$APP_NAME.sh
#!/bin/bash

source /etc/bashrc
mod_wsgi-express setup-server $APP_ROOT/app/$APP_NAME.wsgi \\
--user $APP_USER \\
--group $APP_GROUP \\
--port $APP_PORT \\
--server-root $APP_ROOT/wsgi \\
--document-root $APP_ROOT/app \\
--working-directory $APP_ROOT/app \\
--directory-index index.html \\
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
fi


# Create start-<app>.sh
cat << EOF > $APP_ROOT/start-$APP_NAME.sh
#!/bin/bash

source /etc/bashrc
. $APP_ROOT/wsgi/apachectl start
EOF


# Create stop-<app>.sh
cat << EOF > $APP_ROOT/stop-$APP_NAME.sh
#!/bin/bash

source /etc/bashrc
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
if [ $LOGGING = true ]; then
  echo This script will generate three folders in the specified directory:
  echo   /app  - Contains application files
  echo   /wsgi - Contains wsgi configuration files
  echo   /logs - Contains log files
else
  echo This script will generate two folders in the specified directory:
  echo   /app  - Contains application files
  echo   /wsgi - Contains wsgi configuration files
fi


fi
