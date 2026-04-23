FROM nginx:alpine
COPY frontend/index.html /usr/share/nginx/html/index.html
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
COPY landing/ /usr/share/nginx/html/landing/
EXPOSE 80