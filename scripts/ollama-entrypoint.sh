#!/bin/sh
set -e

MODEL="${OLLAMA_MODEL:-qwen2.5:7b}"

# Start Ollama server in the background
ollama serve &
SERVER_PID=$!

# Wait for the server to be ready
echo "Waiting for Ollama server..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

# Pull the model if not already present
if ! ollama list | grep -q "^${MODEL}"; then
  echo "Pulling model ${MODEL}... (this may take a few minutes on first run)"
  ollama pull "$MODEL"
  echo "Model ${MODEL} ready."
else
  echo "Model ${MODEL} already available."
fi

# Keep the server in the foreground
wait $SERVER_PID
