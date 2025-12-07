FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS runtime
RUN adduser -D -H -u 10001 appuser && mkdir -p /var/cache/nginx /var/run && chown -R appuser /usr/share/nginx/html /var/cache/nginx /var/run /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER 10001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
