#!/bin/bash
pushd AtlassianSketchFramework
xcodebuild -scheme AtlassianSketchFramework build
popd
skpm build
