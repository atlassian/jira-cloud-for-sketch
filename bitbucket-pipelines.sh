#!/bin/bash
npm install
npm test
npm install -g skpm@0.9.16
skpm build
apt-get update && apt-get install -y zip python-pip python-dev
zip -r "jira.sketchplugin-$BITBUCKET_COMMIT.zip" jira.sketchplugin
pip install boto3
python s3_upload.py atlassian-sketch-plugin "jira.sketchplugin-$BITBUCKET_COMMIT.zip" "jira.sketchplugin-$BITBUCKET_COMMIT.zip"
if [ -v PIPELINES_DEPLOY_AS_LATEST ]; then
  python s3_upload.py atlassian-sketch-plugin "jira.sketchplugin-$BITBUCKET_COMMIT.zip" "jira.sketchplugin-latest.zip"
fi
