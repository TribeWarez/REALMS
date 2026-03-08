# REALMS dev-kit: Python 3 + Qiskit + quimb for thesis (Part IV tensor networks)
FROM python:3.11-slim

WORKDIR /workspace

# Minimal system deps for scientific libs (no heavy build deps unless needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8888

CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--allow-root", "--no-browser"]
