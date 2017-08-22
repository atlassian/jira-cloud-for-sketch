#/bin/bash
docker run --name sketch_bash -v `pwd`:/jira-sketch-plugin --rm -it kannonboy/atlassian-sketch-plugin:0.0.2 /bin/bash
