# Jupyter Server configuration for REALMS dev-kit Space
# Allow the Jupyter Lab UI to be embedded in iframes from Hugging Face origins.
# By default Jupyter Lab sends `Content-Security-Policy: frame-ancestors 'self'`
# which blocks embedding on Hugging Face Spaces pages.  The directive below
# restricts framing to the Space itself and the HuggingFace domain family,
# preventing clickjacking from unrelated third-party sites while still
# permitting the expected HF Spaces / huggingface.co embedding workflow.
c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors 'self' https://huggingface.co https://*.hf.space",
    }
}
