#! /bin/bash

echo "Building Chrome version $1"

mkdir -p versions/fieldfinder_0_$1/chrome/build
cp -r css versions/fieldfinder_0_$1/chrome/build
cp -r scripts versions/fieldfinder_0_$1/chrome/build
cp manifest_chrome.json versions/fieldfinder_0_$1/chrome/build/manifest.json
zip -r versions/fieldfinder_0_$1/fieldfinder_0_$1_chrome.zip versions/fieldfinder_0_$1/chrome/build/*
rm -rf versions/fieldfinder_0_$1/chrome
echo "Done"