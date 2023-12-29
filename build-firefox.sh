#! /bin/bash

echo "Building Firefox version $1"
mkdir -p versions/fieldfinder_0_$1/firefox/build
cp -r css versions/fieldfinder_0_$1/firefox/build
cp -r scripts versions/fieldfinder_0_$1/firefox/build
cp -r bootstrap versions/fieldfinder_0_$1/firefox/build
cp popup.html versions/fieldfinder_0_$1/firefox/build
cp icon128.png versions/fieldfinder_0_$1/firefox/build
cp manifest_firefox.json versions/fieldfinder_0_$1/firefox/build/manifest.json
cd versions/fieldfinder_0_$1/firefox/build/
zip -r ../../fieldfinder_0_$1_firefox.zip *
cd ../../
rm -rf firefox
echo "Done"