#! /bin/bash

echo "Building version $1"
mkdir -p versions/fieldfinder_0_$1/build
cp -r css versions/fieldfinder_0_$1/build
cp -r scripts versions/fieldfinder_0_$1/build
cp -r bootstrap versions/fieldfinder_0_$1/build
cp popup.html versions/fieldfinder_0_$1/build
cp icon128.png versions/fieldfinder_0_$1/build
cp manifest.json versions/fieldfinder_0_$1/build/manifest.json
cd versions/fieldfinder_0_$1/build/
zip -r ../../fieldfinder_0_$1.zip *
cd ../../../
rm -rf versions/fieldfinder_0_$1/
echo "Done"