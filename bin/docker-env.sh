#/bin/bash
DOCKER_IMAGE=`cat bitbucket-pipelines.yml | head -1 | cut -c 8-`
docker run --name sketch_bash -v `pwd`:/jira-sketch-plugin --rm -it $DOCKER_IMAGE /bin/bash
