#!/bin/sh
# Alpine Linux setup script
# Removes onnxruntime-node to prevent glibc dependency errors
# The transformers library will fall back to onnxruntime-web (WASM)

echo "Removing onnxruntime-node for Alpine Linux compatibility..."

# Remove the onnxruntime-node directory
rm -rf node_modules/onnxruntime-node

# Create a stub module so imports don't fail
mkdir -p node_modules/onnxruntime-node
cat > node_modules/onnxruntime-node/package.json << 'EOF'
{
  "name": "onnxruntime-node",
  "version": "0.0.0-stub",
  "main": "index.js",
  "type": "module"
}
EOF

cat > node_modules/onnxruntime-node/index.js << 'EOF'
// Stub module for Alpine Linux
// @xenova/transformers will use onnxruntime-web instead
export default {};
EOF

echo "✓ Alpine Linux setup complete - WASM backend will be used"
