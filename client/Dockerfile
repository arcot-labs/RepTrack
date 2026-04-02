### base
FROM node:lts-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm i --frozen-lockfile

COPY public/ ./public/
COPY src/ ./src/
COPY index.html tsconfig*.json vite.config.ts ./

ARG VITE_ENV
ARG VITE_IMAGE_TAG
ARG VITE_API_URL

RUN test -n "$VITE_ENV" && echo "VITE_ENV: $VITE_ENV"
RUN test -n "$VITE_IMAGE_TAG" && echo "VITE_IMAGE_TAG: $VITE_IMAGE_TAG"
RUN test -n "$VITE_API_URL" && echo "VITE_API_URL: $VITE_API_URL"

ENV VITE_ENV=${VITE_ENV}
ENV VITE_IMAGE_TAG=${VITE_IMAGE_TAG}
ENV VITE_API_URL=${VITE_API_URL}


### dev
FROM base AS dev

EXPOSE 5173

# binds to all interfaces
CMD ["pnpm", "run", "dev", "--host"]


### build
FROM base AS build

RUN pnpm run build


### prod
FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
