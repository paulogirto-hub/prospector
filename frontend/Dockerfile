FROM nginx:alpine
COPY frontend/index.html /usr/share/nginx/html/index.html
COPY frontend/manifest.json /usr/share/nginx/html/manifest.json
COPY frontend/sw.js /usr/share/nginx/html/sw.js
COPY frontend/css/ /usr/share/nginx/html/css/
COPY frontend/js/ /usr/share/nginx/html/js/
COPY frontend/icons/ /usr/share/nginx/html/icons/
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80