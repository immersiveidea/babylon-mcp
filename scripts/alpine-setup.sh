#!/bin/sh
# Alpine Linux setup script
# Patches @xenova/transformers to use onnxruntime-web instead of onnxruntime-node
# This is required for Alpine Linux (musl libc) compatibility

echo "Configuring Transformers.js for Alpine Linux (WASM backend)..."

# Patch the ONNX backend selector to always use onnxruntime-web
ONNX_BACKEND_FILE="node_modules/@xenova/transformers/src/backends/onnx.js"

if [ -f "$ONNX_BACKEND_FILE" ]; then
    # Backup original file
    cp "$ONNX_BACKEND_FILE" "$ONNX_BACKEND_FILE.bak"

    # Replace the backend selection logic to always use ONNX_WEB
    cat > "$ONNX_BACKEND_FILE" << 'EOF'
/**
 * @file Handler file for choosing the correct version of ONNX Runtime, based on the environment.
 * PATCHED FOR ALPINE LINUX: Always uses onnxruntime-web (WASM backend)
 * @module backends/onnx
 */

// Only import onnxruntime-web for Alpine Linux compatibility
import * as ONNX_WEB from 'onnxruntime-web';

/** @type {import('onnxruntime-web')} The ONNX runtime module. */
export let ONNX;

export const executionProviders = [
    'wasm'
];

// Always use ONNX_WEB (WASM backend) on Alpine Linux
ONNX = ONNX_WEB.default ?? ONNX_WEB;
EOF

    echo "✓ Patched @xenova/transformers backend to use WASM"
else
    echo "✗ Could not find $ONNX_BACKEND_FILE"
    exit 1
fi

echo "✓ Alpine Linux setup complete - WASM backend will be used"
