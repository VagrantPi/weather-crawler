# Build binary
FROM node:14.17.2
ENV NODE_OPTIONS=""
WORKDIR /usr/src/weather-crawler

COPY package*.json ./
RUN npm install
ADD ./docker/docker-entrypoint.sh /entrypoint.sh
COPY . .
EXPOSE 3000

CMD ["/bin/sh", "/entrypoint.sh"]
