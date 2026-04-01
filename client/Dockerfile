### base
FROM node:lts-alpine AS base

WORKDIR /src

RUN corepack enable && corepack prepare pnpm@latest --activate

# optimize layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

COPY public/ ./public/
COPY src/ ./src/
COPY index.html tsconfig*.json vite.config.ts ./


### dev
FROM base AS dev

EXPOSE 5173

# binds to all interfaces
CMD ["pnpm", "run", "dev", "--", "--host"]


### build
FROM base AS build

ARG VITE_ENV
ARG VITE_IMAGE_TAG
ARG VITE_API_URL

ENV VITE_ENV=${VITE_ENV}
ENV VITE_IMAGE_TAG=${VITE_IMAGE_TAG}
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm run build


### prod
FROM nginx:alpine AS prod

COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
