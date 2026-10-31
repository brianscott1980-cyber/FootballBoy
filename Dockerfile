FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:3010/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
