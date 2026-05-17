FROM nginx:1.27-alpine

COPY docker/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template

# Restrict envsubst to our own variables so nginx's $vars stay intact.
ENV NGINX_ENVSUBST_FILTER="SHELL_HOST|SHELL_API_HOST|ACCESS_MANAGER_HOST"

EXPOSE 80
