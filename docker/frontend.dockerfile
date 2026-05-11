FROM nginx:alpine

ARG TIER=dev

COPY ${TIER}_index /usr/share/nginx/html/index.html
COPY common/ /usr/share/nginx/html/common/

EXPOSE 80
