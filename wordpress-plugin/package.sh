#!/bin/bash

# Set version
VERSION="1.1"

# Create a zip file
cd $(dirname "$0")
rm -f yakkt-campervan-configurator-$VERSION.zip
rm -f yakkt-campervan-configurator.zip
zip -r yakkt-campervan-configurator-$VERSION.zip yakkt-campervan-configurator -x "*.DS_Store" -x "*.git*"
cp yakkt-campervan-configurator-$VERSION.zip yakkt-campervan-configurator.zip

echo "Created yakkt-campervan-configurator-$VERSION.zip"
echo "Upload this file to your WordPress site via the admin panel." 