"""Package an allowlisted source tree and verify every ZIP member against its digest."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'hot-hermes-0.1.2.zip'
out.parent.mkdir(parents=True,exist_ok=True)
files=[]
for name in ['plugin.yaml','__init__.py','resources.py','README.md','INSTALL.md','VALIDATION.md','VALIDATION.json','CHANGELOG.md','LICENSE','.gitignore']:
    files.append(root/name)
for folder in ['src','desktop','dashboard','tests','tools','preview','docs','.github']:
    for p in sorted((root/folder).rglob('*')):
        if p.is_file() and '__pycache__' not in p.parts and p.suffix in ('.py','.mjs','.js','.json','.html','.png','.svg','.yml') and p.name!='bundle.js':files.append(p)
files=sorted(set(files))
manifest={str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
manifest_bytes=json.dumps({'version':'0.1.2','files':manifest},indent=2).encode()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,'hot-hermes/'+str(p.relative_to(root)).replace('\\','/'))
    z.writestr('hot-hermes/MANIFEST.json',manifest_bytes)
with zipfile.ZipFile(out) as z:
    assert len(z.namelist())==len(manifest)+1
    assert z.testzip() is None
    for name,digest in manifest.items():assert hashlib.sha256(z.read('hot-hermes/'+name)).hexdigest()==digest
sha=hashlib.sha256(out.read_bytes()).hexdigest()
Path(str(out)+'.sha256').write_text(sha+'  '+out.name+'\n',encoding='utf8')
print(json.dumps({'package':str(out),'bytes':out.stat().st_size,'sha256':sha,'files':len(manifest)+1,'verified':True},indent=2))
