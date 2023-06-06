#! /bin/bash

echo "Building Chrome version $1"

mkdir -p versions/fieldfinder_0_$1/chrome/build
cp -r css versions/fieldfinder_0_$1/chrome/build
cp -r scripts versions/fieldfinder_0_$1/chrome/build
cp manifest_chrome.json versions/fieldfinder_0_$1/chrome/build/manifest.json
cd versions/fieldfinder_0_$1/chrome/build/
zip -r ../../fieldfinder_0_$1_chrome.zip *
cd ../../
rm -rf chrome
echo "Done"