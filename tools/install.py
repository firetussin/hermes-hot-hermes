"""Explicit, offline, bounded installation. Dry run unless --apply; never enables/restarts Hermes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
import time

ROOT=Path(__file__).resolve().parents[1]
BACKEND=['plugin.yaml','__init__.py','resources.py','dashboard/manifest.json','dashboard/plugin_api.py','README.md','LICENSE']
DESKTOP=['desktop/plugin.js']

def install(home,part,apply=False,replace=False):
    home=Path(home).expanduser().resolve()
    if part not in ('backend','desktop'):raise ValueError('Unknown installation part')
    target=home/('plugins' if part=='backend' else 'desktop-plugins')/'hot-hermes'
    if not target.resolve().is_relative_to(home):raise ValueError('Destination escapes selected Hermes home')
    if target.is_symlink() or (target.exists() and not target.is_dir()):raise ValueError('Destination must be a regular directory')
    if target.exists() and not replace:raise ValueError('Existing plugin found; use --replace to back it up before replacement')
    backup_root=home/'plugin-backups'
    if backup_root.is_symlink() or not backup_root.resolve().is_relative_to(home):raise ValueError('Backup root must stay inside the selected Hermes home')
    if backup_root.exists() and not backup_root.is_dir():raise ValueError('Backup root must be a directory')
    items=BACKEND if part=='backend' else DESKTOP
    names=[(name,'plugin.js' if part=='desktop' else name) for name in items]
    manifest=[]
    for src,dest in names:
        data=(ROOT/src).read_bytes()
        manifest.append({'source':src,'destination':dest,'sha256':hashlib.sha256(data).hexdigest()})
    result={'target':str(target),'part':part,'apply':apply,'files':manifest,'backup':None,'backup_root':str(backup_root)}
    if not apply:return result
    target.parent.mkdir(parents=True,exist_ok=True)
    backup_root.mkdir(parents=True,exist_ok=True)
    staging=Path(tempfile.mkdtemp(prefix='.hot-hermes-stage-',dir=backup_root))
    backup=None
    try:
        for src,dest in names:
            path=staging/dest;path.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/src,path)
        if target.exists():
            backup=backup_root/('hot-hermes-'+part+'-'+str(time.time_ns()))
            os.replace(target,backup)
        try:os.replace(staging,target)
        except Exception:
            if backup is not None:os.replace(backup,target)
            raise
        result['backup']=str(backup) if backup else None
    finally:
        if staging.exists():
            if staging.resolve().parent != backup_root.resolve() or not staging.name.startswith('.hot-hermes-stage-'):
                raise ValueError('Refusing cleanup outside installer staging directory')
            shutil.rmtree(staging)
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home',required=True,help='Actual Hermes home on this machine; explicit to avoid choosing another profile')
    parser.add_argument('--part',choices=['backend','desktop'],required=True)
    parser.add_argument('--apply',action='store_true');parser.add_argument('--replace',action='store_true')
    args=parser.parse_args()
    try:print(json.dumps(install(args.home,args.part,args.apply,args.replace),indent=2))
    except (OSError,ValueError) as e:parser.exit(1,str(e)+'\n')
