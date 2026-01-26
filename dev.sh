#!/bin/bash
# Filter out ONNX Runtime spam warnings
npx tsx src/index.ts 2>&1 | grep -v "onnxruntime.*CleanUnusedInitializersAndNodeArgs"
