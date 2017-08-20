#!/bin/bash

# install deps (TODO move these into a Dockerfile)
apt-get update && apt-get install -y zip python-pip python-dev
pip install boto3
npm install -g skpm@0.9.16 bitbucket-build-status

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
export S3_BUCKET_URL="https://s3-us-west-2.amazonaws.com/${S3_BUCKET}"

zip -r $PLUGIN_ZIP $PLUGIN_NAME

# postBuildStatus $key $name $description $url
postBuildStatus () {
  node_modules/.bin/bbuild \
    -u ${BB_UPLOAD_USERNAME} \
    -p ${BB_UPLOAD_PASSWORD} \
    -o ${BITBUCKET_REPO_OWNER} \
    -r ${BITBUCKET_REPO_SLUG} \
    -c ${BITBUCKET_COMMIT} \
    -s "SUCCESSFUL" \
    -k $1 -n $2 -d $3 -l $4
}

# deploy plugin artifact(s)
python s3_upload.py $S3_BUCKET $PLUGIN_ZIP $PLUGIN_ZIP
postBuildStatus "sketch-plugin-zip" $PLUGIN_ZIP \
    'Sketch plugin zip' "${S3_BUCKET_URL}/${PLUGIN_ZIP}"

if [ -v PIPELINES_DEPLOY_AS_LATEST ]; then
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-latest.zip"
fi

if [ -v PIPELINES_DEPLOY_TAG ]; then
  export RELEASE_ZIP_NAME="${PLUGIN_NAME}-$BITBUCKET_TAG.zip"
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP $PLUGIN_RELEASE_ZIP
  postBuildStatus "sketch-plugin-release-zip" $PLUGIN_RELEASE_ZIP \
    'Sketch plugin release zip' "${S3_BUCKET_URL}/${PLUGIN_RELEASE_ZIP}"
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-release.zip"
fi

# deploy appcast.xml
if [ -v PIPELINES_UPDATE_APPCAST ]; then
  python s3_upload.py $S3_BUCKET appcast.xml appcast.xml
fi
