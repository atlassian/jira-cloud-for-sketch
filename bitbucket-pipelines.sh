#!/bin/bash

# install deps (TODO move these into a Dockerfile)
apt-get update && apt-get install -y zip python-pip python-dev
pip install boto3
npm install -g skpm@0.9.16

# run the tests
npm install
npm test

# Note: the AtlassianSketchFramework is written in Objective-C and can not be
# built in Bitbucket Pipelines' Docker environment. Therefore if you make
# changes to /AtlassianSketchFramework, make sure you rebuild the project locally
# using XCode (or `./build.sh`) before committing!

# build the plugin
skpm build
export PLUGIN_NAME="atlassian.sketchplugin"
export PLUGIN_ZIP="${PLUGIN_NAME}-${BITBUCKET_COMMIT}.zip"
export S3_BUCKET="atlassian-sketch-plugin"
zip -r $PLUGIN_ZIP $PLUGIN_NAME

# deploy plugin artifact(s)
python s3_upload.py $S3_BUCKET $PLUGIN_ZIP $PLUGIN_ZIP
if [ -v PIPELINES_DEPLOY_AS_LATEST ]; then
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-latest.zip"
fi
if [ -v PIPELINES_DEPLOY_TAG ]; then
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-$BITBUCKET_TAG.zip"
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-release.zip"
fi

# deploy appcast.xml
if [ -v PIPELINES_UPDATE_APPCAST ]; then
  python s3_upload.py $S3_BUCKET appcast.xml appcast.xml
fi

# publish build status
export S3_URL="https://s3-us-west-2.amazonaws.com/${S3_BUCKET}/${PLUGIN_ZIP}"
export BUILD_STATUS="{\"key\": \"sketch-plugin-zip\", \"state\": \"SUCCESSFUL\", \"name\": \"Sketch Plugin ZIP\", \"url\": \"${S3_URL}\"}"
curl -H "Content-Type: application/json" -X POST --user "${BB_UPLOAD_USERNAME}:${BB_UPLOAD_PASSWORD}" -d "${BUILD_STATUS}" "https://api.bitbucket.org/2.0/repositories/${BITBUCKET_REPO_OWNER}/${BITBUCKET_REPO_SLUG}/commit/${BITBUCKET_COMMIT}/statuses/build"
