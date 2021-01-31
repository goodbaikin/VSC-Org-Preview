FROM goodbaikin/vscode-extension
ARG UID
ARG GID
RUN curl https://get.docker.com | sh 
RUN  groupmod -g ${GID} docker && \
    usermod -aG docker node
USER node

