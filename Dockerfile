# Build environment for bitbucket-pipelines.yml
FROM node:7.10.0

# Python dependencies
RUN apt-get update && apt-get install -y zip python-pip python-dev
RUN pip install boto3

# npm dependencies
RUN npm install -g skpm@0.9.16 bitbucket-build-status

# Install Chrome
RUN echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/chrome.list
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN set -x \
    && apt-get update \
    && apt-get install -y \
        xvfb \
        google-chrome-stable
