FROM public.ecr.aws/amazonlinux/amazonlinux:2023

ARG TIER=dev

RUN dnf upgrade -y --releasever=latest && \
    dnf install -y --releasever=latest nginx && \
    dnf clean all && \
    chmod 700 /usr/bin/python3.9

COPY ${TIER}_index /usr/share/nginx/html/index.html
COPY common/ /usr/share/nginx/html/common/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
