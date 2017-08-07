if [ "$#" -ne 2 ]; then
  echo 'Usage set-pref.sh <key> <value>'
  exit 1
fi
/usr/bin/defaults write ~/Library/Preferences/plugin.sketch.jira-sketch-plugin $1 $2
