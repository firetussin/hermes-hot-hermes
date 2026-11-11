from pathlib import Path
import importlib.util
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('hot_installer_tests',ROOT/'tools/install.py')
installer=importlib.util.module_from_spec(spec);spec.loader.exec_module(installer)
class InstallerTests(unittest.TestCase):
    def test_dry_run_does_not_create_home(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp)/'not-created';r=installer.install(home,'backend');self.assertFalse(home.exists());self.assertFalse(r['apply'])
    def test_install_only_allowlisted_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp);r=installer.install(home,'backend',True)
            self.assertEqual(sorted(str(p.relative_to(Path(r['target']))).replace('\\','/') for p in Path(r['target']).rglob('*') if p.is_file()),sorted(installer.BACKEND))
            self.assertFalse((home/'config.yaml').exists())
    def test_existing_refused_and_explicit_replace_preserves_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp);r=installer.install(home,'desktop',True);target=Path(r['target']);(target/'operator-note').write_text('keep')
            with self.assertRaises(ValueError):installer.install(home,'desktop',True)
            r=installer.install(home,'desktop',True,True);self.assertEqual((Path(r['backup'])/'operator-note').read_text(),'keep');self.assertTrue((target/'plugin.js').is_file())
    def test_replacement_keeps_manifests_and_staging_outside_discovery_roots(self):
        for part,scan in [('backend','plugins'),('desktop','desktop-plugins')]:
            with self.subTest(part=part), tempfile.TemporaryDirectory() as tmp:
                home=Path(tmp);first=installer.install(home,part,True)
                target=Path(first['target'])
                marker=target/('plugin.yaml' if part=='backend' else 'plugin.js')
                marker.write_text('old release')
                result=installer.install(home,part,True,True)
                backup=Path(result['backup'])
                self.assertTrue(backup.is_relative_to(home/'plugin-backups'))
                self.assertFalse(backup.is_relative_to(home/scan))
                self.assertEqual((backup/marker.name).read_text(),'old release')
                self.assertEqual([p.name for p in (home/scan).iterdir()],['hot-hermes'])
                self.assertNotEqual(marker.read_text(),'old release')
    def test_unknown_part_refused(self):
        with self.assertRaises(ValueError):installer.install('.','unknown')
if __name__=='__main__':unittest.main()
