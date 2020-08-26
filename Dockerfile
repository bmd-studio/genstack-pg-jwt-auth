ARG DOCKER_IMAGE
ARG GS_ENV

FROM $DOCKER_IMAGE AS builder 
ARG GS_ENV

COPY ./ /usr/src/app
WORKDIR /usr/src/app/

RUN /bin/bash setup.sh

FROM builder AS build_development
RUN echo "Building development image..."

FROM builder AS build_staging
RUN echo "Building staging image..."

FROM builder AS build_production
RUN echo "Building production image..."

FROM build_${GS_ENV}

RUN echo "Running ${GS_ENV} image..."
WORKDIR /usr/src/app/

COPY docker-healthcheck.js /usr/local/lib/
HEALTHCHECK --interval=5s --timeout=10s --retries=3 CMD node /usr/local/lib/docker-healthcheck.js

USER node

# CMD tail -f /dev/null
CMD ["/bin/bash", "exec.sh"]
