FROM node:18.19.0

ARG USERNAME=
ARG TOKEN=

RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg libavcodec-dev libavdevice-dev\
    git nfs-common\
    libssl-dev \
  && rm -rf /var/lib/apt/lists/*



RUN echo "https://${USERNAME}:${TOKEN}@github.com/"

RUN git config \
  --global \
  url."https://${USERNAME}:${TOKEN}@github.com/".insteadOf \
  "https://github.com/"  


# global npm dependencies
RUN npm install -g grunt-cli \
  && npm install -g adapt-cli \
  && npm install -g rub-cli


WORKDIR /adapt_authoring

COPY . /adapt_authoring
RUN npm install
RUN npm run build

EXPOSE 5000

CMD ["node", "server"]

RUN git config \
  --global \
  url."https://github.com/".insteadOf \
  "https://${USERNAME}:${TOKEN}@github.com/"  