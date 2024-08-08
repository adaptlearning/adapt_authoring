FROM node:18.19.0

ENV AAT_VER=0.10.5

RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg libavcodec-dev libavdevice-dev\
    git nfs-common\
    libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# global npm dependencies
RUN npm install -g grunt-cli \
  && npm install -g adapt-cli \
  && npm install -g rub-cli


WORKDIR /adapt_authoring

COPY . /adapt_authoring


EXPOSE 5000

CMD ["node", "server"]
