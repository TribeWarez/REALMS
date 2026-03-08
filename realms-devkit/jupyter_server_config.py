# Jupyter Server configuration for REALMS dev-kit Space
# Allow the Jupyter Lab UI to be embedded in iframes from Hugging Face origins.
# By default Jupyter Lab sends `Content-Security-Policy: frame-ancestors 'self'`
# which blocks embedding on Hugging Face Spaces pages.  The directives below
# restrict framing to the Space itself and the HuggingFace domain family,
# preventing clickjacking from unrelated third-party sites while still
# permitting the expected HF Spaces / huggingface.co embedding workflow.

# Primary: ServerApp.content_security_policy is the jupyter-server 2.x config
# trait; it controls the CSP header sent by JupyterHandler.set_default_headers().
FRAME_ANCESTORS_CSP = "frame-ancestors 'self' https://huggingface.co https://*.hf.space"
c.ServerApp.content_security_policy = FRAME_ANCESTORS_CSP

# Belt-and-suspenders: tornado_settings headers are applied inside
# JupyterHandler.set_default_headers() after the trait value and take
# precedence when both are present, ensuring the header is always correct.
c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": FRAME_ANCESTORS_CSP,
    }
}
