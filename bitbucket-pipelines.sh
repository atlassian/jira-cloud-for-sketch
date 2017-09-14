#!/bin/bash

# Install dependencies (there's a few!)
npm install

# Note: the AtlassianSketchFramework is written in Objective-C and can not be
# built in Bitbucket Pipelines' Docker environment. Therefore if you make
# changes to /AtlassianSketchFramework, make sure you rebuild the project locally
# using XCode (or `./build.sh`) before committing!

# build the plugin
skpm build

# run the tests
npm test

export PLUGIN_NAME="jira.sketchplugin"
export PLUGIN_ZIP="${PLUGIN_NAME}-${BITBUCKET_COMMIT}.zip"
export S3_BUCKET="atlassian-sketch-plugin"
export S3_BUCKET_URL="https://s3-us-west-2.amazonaws.com/${S3_BUCKET}"

# get access token for posting build statuses and pushing to Bitbucket
export BITBUCKET_ACCESS_TOKEN=`curl -s -X POST -u "${BB_CONSUMER_KEY}:${BB_CONSUMER_SECRET}" https://bitbucket.org/site/oauth2/access_token -d grant_type=client_credentials | jq .access_token -r`

zip -r $PLUGIN_ZIP $PLUGIN_NAME

# postBuildStatus $key $name $description $url
postBuildStatus () {
  node_modules/.bin/bbuild \
    -b ${BITBUCKET_ACCESS_TOKEN} \
    -o ${BITBUCKET_REPO_OWNER} \
    -r ${BITBUCKET_REPO_SLUG} \
    -c ${BITBUCKET_COMMIT} \
    -s "SUCCESSFUL" \
    -k "$1" -n "$2" -d "$3" -l "$4"
}

# deploy plugin artifact(s)
python s3_upload.py $S3_BUCKET $PLUGIN_ZIP $PLUGIN_ZIP
postBuildStatus "sketch-plugin-zip" $PLUGIN_ZIP \
  "Sketch plugin zip" "${S3_BUCKET_URL}/${PLUGIN_ZIP}"

if [ -v PIPELINES_DEPLOY_AS_LATEST ]; then
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}-latest.zip"
fi

if [ -v PIPELINES_DEPLOY_TAG ]; then
  export PLUGIN_RELEASE_ZIP="${PLUGIN_NAME}-$BITBUCKET_TAG.zip"
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP $PLUGIN_RELEASE_ZIP
  postBuildStatus "sketch-plugin-release-zip" $PLUGIN_RELEASE_ZIP \
    "Sketch plugin release zip" "${S3_BUCKET_URL}/${PLUGIN_RELEASE_ZIP}"
  python s3_upload.py $S3_BUCKET $PLUGIN_ZIP "${PLUGIN_NAME}.zip"
  python s3_upload.py $S3_BUCKET appcast.xml appcast.xml

  # update settings for write access
  git remote set-url origin https://x-token-auth:${BITBUCKET_ACCESS_TOKEN}@bitbucket.org/${BITBUCKET_REPO_OWNER}/${BITBUCKET_REPO_SLUG}.git
  git config user.name "${COMMITTER_NAME}"
  git config user.email "${COMMITTER_EMAIL}"

  # switch to release branch without touching index / working copy
  git fetch origin $BITBUCKET_RELEASE_BRANCH:$BITBUCKET_RELEASE_BRANCH
  git reset $BITBUCKET_RELEASE_BRANCH
  git checkout $BITBUCKET_RELEASE_BRANCH

  # commit source from tag plus compiled plugin files
  git add .
  git add -f $PLUGIN_NAME
  git commit -m "Build v$BITBUCKET_TAG"

  # push to Bitbucket & GitHub
  git push origin $BITBUCKET_RELEASE_BRANCH
  git push -f $GITHUB_SSH_URL $BITBUCKET_RELEASE_BRANCH:$GITHUB_RELEASE_BRANCH
fi
