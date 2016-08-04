#!/bin/bash

#: Description  : Generates scripts to setup, start, and stop a wsgi application using mod_wsgi-express
#: Options      : -n | --name  The name of the application (the .wsgi file should have the same name as the application)
#               : -p | --port  The port this application will be running on
#               : -r | --root  The root directory of this application. This directory has a folder called "app" that contains all application files

APP_NAME=
APP_PORT=
APP_ROOT=

# Parse arguments
while true; do
  case "$1" in
    -n | --name ) APP_NAME="$2"; shift 2 ;;
    -p | --port ) APP_PORT="$2"; shift 2 ;;
    -r | --root ) APP_ROOT="$2"; shift 2 ;;
    * ) break ;;
  esac
done

if [ "$APP_NAME" ] && [ "$APP_PORT" ] && [ "$APP_ROOT" ]
then

# Create app_root if it does not exist
mkdir -p $APP_ROOT/app $APP_ROOT/wsgi $APP_ROOT/logs


# Additional configuration directives
cat << EOF > $APP_ROOT/wsgi/additional-configuration.conf

# Do not serve certain filetypes
<FilesMatch "\.(conf|db|ini|py|wsgi|xml|R|r|md)$">
  Require all denied
</FilesMatch>

EOF


# Create setup-<app>.sh
cat << EOF > $APP_ROOT/setup-$APP_NAME.sh
#!/bin/bash

mod_wsgi-express setup-server $APP_ROOT/app/$APP_NAME.wsgi \\
--port $APP_PORT \\
--user apache \\
--group apache \\
--server-root $APP_ROOT/wsgi \\
--document-root $APP_ROOT/app \\
--working-directory $APP_ROOT/app \\
--directory-index index.html \\
--log-directory $APP_ROOT/logs \\
--rotate-logs \\
--error-log-name $APP_NAME.log \\
--include-file $APP_ROOT/wsgi/additional-configuration.conf \\
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

. $APP_ROOT/wsgi/apachectl stop
EOF

chmod 755 $APP_ROOT/setup-$APP_NAME.sh
chmod 755 $APP_ROOT/start-$APP_NAME.sh
chmod 755 $APP_ROOT/stop-$APP_NAME.sh

else
echo Please provide parameters in the following format:
echo ./build.sh --name app_name --port 0000 --root /path/to/app/root
echo
echo This script will generate three folders in the specified directory: 
echo   /app  - Contains application files
echo   /wsgi - Contains wsgi configuration files
echo   /logs - Contains log files

fi
