#! /bin/bash

echo "Building Firefox version $1"
mkdir -p versions/fieldfinder_0_$1/firefox/build
cp -r css versions/fieldfinder_0_$1/firefox/build
cp -r scripts versions/fieldfinder_0_$1/firefox/build
cp manifest_firefox.json versions/fieldfinder_0_$1/firefox/build/manifest.json
zip -r versions/fieldfinder_0_$1/fieldfinder_0_$1_firefox.zip versions/fieldfinder_0_$1/firefox/build/*
rm -rf versions/fieldfinder_0_$1/firefox
echo "Done"