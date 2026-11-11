"""Optional offline preview build using caller-provided existing npm dependencies; never installs."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--node-modules',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];modules=Path(args.node_modules).resolve();vendor=root/'.test-vendor'
for name in ('react','react-dom','scheduler'):
    source=(modules/name).resolve()
    if not source.is_dir():raise SystemExit('Missing existing dependency: '+name)
    shutil.copytree(source,vendor/name,dirs_exist_ok=True)
command=['node',str(modules/'esbuild/bin/esbuild'),str(root/'tests/preview.mjs'),'--bundle','--outfile='+str(root/'preview/bundle.js')]
for name in ('react','react-dom','scheduler'):command.append('--alias:'+name+'='+str(vendor/name))
command.append('--alias:@hermes/plugin-sdk='+str(root/'tests/sdk-fixture.mjs'))
subprocess.run(command,check=True)
print(json.dumps({'preview':str(root/'preview/index.html')}))
