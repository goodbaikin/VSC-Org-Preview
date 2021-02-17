FROM goodbaikin/vscode-extension
ARG UID
ARG GID
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/* &&\
    curl https://get.docker.com | sh 
RUN  groupmod -g ${GID} docker && \
    usermod -aG docker node
USER node

