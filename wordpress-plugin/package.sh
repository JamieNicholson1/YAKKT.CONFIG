#!/bin/bash

# Create a zip file of the WordPress plugin
echo "Packaging Yakkt Campervan Configurator WordPress plugin..."
cd "$(dirname "$0")"
zip -r yakkt-campervan-configurator.zip yakkt-campervan-configurator

echo "Plugin packaged successfully: yakkt-campervan-configurator.zip"
echo "Upload this file to your WordPress site via the admin panel." 