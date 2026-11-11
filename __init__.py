"""Hot Hermes registers one read-only diagnostic tool. No work during import."""
import json

def register(ctx):
    from .resources import snapshot
    def status(args, **kwargs):
        return json.dumps(snapshot())
    ctx.register_tool(name="hot_hermes_status", toolset="hot_hermes", schema={
        "name": "hot_hermes_status",
        "description": "Read current Hermes-host memory capacity, this backend process tree and sampled CPU. No model requests, profile starts or configuration changes. Missing metrics are reported as unknown.",
        "parameters": {"type": "object", "properties": {}, "additionalProperties": False}
    }, handler=status)
