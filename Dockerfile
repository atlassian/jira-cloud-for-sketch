# Build environment for bitbucket-pipelines.yml
FROM node:7.10.0

ENV DEBIAN_FRONTEND=noninteractive LANG=en_US.UTF-8 LC_ALL=C.UTF-8 \
    LANGUAGE=en_US.UTF-8 TERM=dumb DBUS_SESSION_BUS_ADDRESS=/dev/null \
    CHROME_VERSION=stable_current \
    SCREEN_WIDTH=1360 SCREEN_HEIGHT=1020 SCREEN_DEPTH=24

RUN rm -rf /var/lib/apt/lists/* && apt-get -q update && \
    apt-get install -qy --force-yes \
    xvfb fontconfig bzip2 curl libxss1 libappindicator1 libindicator7 \
    libpango1.0-0 fonts-liberation xdg-utils gconf-service zip python-pip \
    python-dev lsb-release libnss3 libnspr4 libgtk-3-0 libasound2 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

# Python dependencies & jq (used in bitbucket-pipelines.sh)
RUN apt-get update && apt-get install -y zip python-pip python-dev jq
RUN pip install boto3

# npm dependencies
RUN npm install -g skpm@0.9.16 bitbucket-build-status@1.0.3

# Install Chrome
RUN curl --silent --show-error --location --fail --retry 3 \
    https://dl.google.com/linux/direct/google-chrome-${CHROME_VERSION}_amd64.deb > /tmp/google-chrome-${CHROME_VERSION}_amd64.deb && \
    dpkg -i /tmp/google-chrome-${CHROME_VERSION}_amd64.deb && \
    rm /tmp/google-chrome-${CHROME_VERSION}_amd64.deb

# Override Chrome launcher script to run xvfb
RUN mv /opt/google/chrome/google-chrome /opt/google/chrome/google-chrome.orig && \
    echo '#!/bin/bash' > /opt/google/chrome/google-chrome && \
    echo 'exec xvfb-run -a -s "-screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} -ac +extension RANDR" /opt/google/chrome/google-chrome.orig --no-sandbox "$@"' >> /opt/google/chrome/google-chrome && \
    chmod +x /opt/google/chrome/google-chrome
