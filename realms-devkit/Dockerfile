# REALMS dev-kit: Python 3 + Qiskit + quimb for thesis (Part IV tensor networks)
FROM python:3.11-slim

WORKDIR /workspace

# Minimal system deps for scientific libs (no heavy build deps unless needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Jupyter server configuration (allows iframe embedding from HuggingFace)
RUN mkdir -p /etc/jupyter
COPY jupyter_server_config.py /etc/jupyter/jupyter_server_config.py
# Point JUPYTER_CONFIG_DIR at the system config dir so the file is always found
# even if the home-directory search path is redirected inside the container.
ENV JUPYTER_CONFIG_DIR=/etc/jupyter

# Create a non-root user for running Jupyter
RUN useradd -m -u 1000 jupyter \
    && chown -R jupyter:jupyter /workspace
USER jupyter

EXPOSE 8888

CMD ["sh", "-c", "exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --ServerApp.token=${JUPYTER_TOKEN:-} --ServerApp.password=''"]
