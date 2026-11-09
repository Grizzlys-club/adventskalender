FROM node:24-slim
WORKDIR /app
COPY package.json ./
COPY *.mjs ./
COPY public ./public
ENV PORT=3000
ENV VOTES_DB=/data/votes.sqlite
EXPOSE 3000
CMD ["node", "server.mjs"]
