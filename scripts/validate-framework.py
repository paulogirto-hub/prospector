#!/usr/bin/env python3
"""
Meta-Framework Validator — Prospector Edition
Validates that all modules exist, have proper headers, and dependencies are satisfied.

Usage:
    python3 scripts/validate-framework.py [--path docs/meta-framework] [--verbose]

Exit codes:
    0 = All good
    1 = Issues found
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict


class FrameworkValidator:
    """Validates meta-framework integrity against framework-index.json."""

    # Expected header pattern: # ID-XX — Title or # ID-XX: Title
    HEADER_PATTERN = re.compile(r'^#\s+([A-Z]+-\d+)\s*[—:–-]\s*(.+)', re.MULTILINE)

    # Module directory prefix to category mapping
    CATEGORIES = {
        'core': 'CORE',
        'backend': 'BACK',
        'frontend': 'FRONT',
        'ai': 'AI',
        'infra': 'INFRA',
        'business': 'BIZ',
        'ops': 'OPS',
        'advanced': 'ADV',
        'shared': 'SHRD',
    }

    def __init__(self, base_path: str, verbose: bool = False):
        self.base_path = Path(base_path)
        self.verbose = verbose
        self.index_path = self.base_path / 'framework-index.json'
        self.errors = []
        self.warnings = []
        self.stats = defaultdict(int)

    def log(self, msg: str):
        if self.verbose:
            print(f"  {msg}")

    def validate_index_exists(self) -> bool:
        """Check that framework-index.json exists and is valid JSON."""
        if not self.index_path.exists():
            self.errors.append(f"CRITICAL: framework-index.json not found at {self.index_path}")
            return False

        try:
            with open(self.index_path) as f:
                self.index_data = json.load(f)
            self.log(f"✅ framework-index.json loaded ({len(self.index_data.get('modules', []))} modules)")
            return True
        except json.JSONDecodeError as e:
            self.errors.append(f"CRITICAL: framework-index.json is invalid JSON: {e}")
            return False

    def validate_no_duplicate_docs(self) -> bool:
        """Check that there's no nested docs/ folder (duplicated modules)."""
        nested_docs = self.base_path / 'docs'
        if nested_docs.exists() and nested_docs.is_dir():
            dup_count = sum(1 for _ in nested_docs.rglob('README.md'))
            self.errors.append(
                f"DUPLICATE: Found nested docs/ folder with {dup_count} duplicate modules. "
                f"Run: rm -rf {nested_docs}"
            )
            return False
        self.log("✅ No duplicate docs/ folder")
        return True

    def get_disk_modules(self) -> dict:
        """Scan disk for all module READMEs."""
        modules = {}
        for category_dir in self.base_path.iterdir():
            if not category_dir.is_dir():
                continue
            if category_dir.name in ('docs', 'prompts'):
                continue
            category_name = category_dir.name
            for module_dir in category_dir.iterdir():
                if not module_dir.is_dir():
                    continue
                readme = module_dir / 'README.md'
                module_id = module_dir.name.split('-')[0] + '-' + module_dir.name.split('-')[1]
                modules[module_id] = {
                    'path': str(module_dir.relative_to(self.base_path)),
                    'readme_exists': readme.exists(),
                    'readme_path': str(readme) if readme.exists() else None,
                    'category': category_name,
                }
        return modules

    def validate_modules_exist(self) -> bool:
        """Verify all modules from index exist on disk."""
        if not hasattr(self, 'index_data'):
            return False

        disk_modules = self.get_disk_modules()
        index_ids = {m['id'] for m in self.index_data.get('modules', [])}
        disk_ids = set(disk_modules.keys())

        # Missing from disk
        missing = index_ids - disk_ids
        for mid in sorted(missing):
            self.errors.append(f"MISSING: Module {mid} in index but not found on disk")
            self.stats['missing_on_disk'] += 1

        # Extra on disk
        extra = disk_ids - index_ids
        for mid in sorted(extra):
            self.warnings.append(f"EXTRA: Module {mid} found on disk but not in index")
            self.stats['extra_on_disk'] += 1

        # Check READMEs
        for mid, info in disk_modules.items():
            if not info['readme_exists']:
                self.errors.append(f"MISSING: README.md for module {mid} at {info['path']}")
                self.stats['missing_readme'] += 1

        self.stats['total_index'] = len(index_ids)
        self.stats['total_disk'] = len(disk_ids)
        self.log(f"✅ Modules: {len(disk_ids)} on disk, {len(index_ids)} in index")
        return len(missing) == 0

    def validate_headers(self) -> bool:
        """Check that each module README has a proper header with ID."""
        disk_modules = self.get_disk_modules()
        all_good = True

        for mid, info in disk_modules.items():
            if not info['readme_exists'] or not info['readme_path']:
                continue

            try:
                with open(info['readme_path']) as f:
                    content = f.read(500)  # Only read first 500 chars
            except Exception as e:
                self.errors.append(f"READ: Cannot read {info['readme_path']}: {e}")
                all_good = False
                continue

            match = self.HEADER_PATTERN.search(content)
            if not match:
                self.warnings.append(f"HEADER: Module {mid} missing standard header (expected: '# {mid} — Title')")
                self.stats['non_standard_headers'] += 1
            else:
                found_id = match.group(1)
                if found_id != mid:
                    self.warnings.append(f"HEADER: Module {mid} has mismatched header ID: {found_id}")
                    self.stats['mismatched_headers'] += 1
                else:
                    self.stats['valid_headers'] += 1

        self.log(f"✅ Headers: {self.stats['valid_headers']} valid, {self.stats.get('non_standard_headers', 0)} non-standard")
        return all_good

    def validate_dependencies(self) -> bool:
        """Check that all dependencies referenced in the index exist."""
        if not hasattr(self, 'index_data'):
            return False

        index_ids = {m['id'] for m in self.index_data.get('modules', [])}
        all_good = True

        for module in self.index_data.get('modules', []):
            deps = module.get('dependencies', [])
            if isinstance(deps, list):
                for dep in deps:
                    if dep not in index_ids:
                        self.errors.append(
                            f"DEP: Module {module['id']} depends on {dep}, which doesn't exist in index"
                        )
                        self.stats['broken_deps'] += 1
                    else:
                        self.stats['valid_deps'] += 1

        self.log(f"✅ Dependencies: {self.stats.get('valid_deps', 0)} valid, {self.stats.get('broken_deps', 0)} broken")
        return self.stats.get('broken_deps', 0) == 0

    def validate_key_files(self) -> bool:
        """Check that key framework files exist."""
        key_files = [
            'MASTER.md',
            'README.md',
            'MASTER.en.md',
            'README.en.md',
            'framework-index.json',
            'plano-implementacao.md',
        ]

        all_good = True
        for f in key_files:
            path = self.base_path / f
            if path.exists():
                size = path.stat().st_size
                self.log(f"  ✅ {f} ({size:,} bytes)")
            else:
                self.warnings.append(f"KEY FILE: {f} not found")
                self.stats['missing_key_files'] += 1
                all_good = False

        return all_good

    def run(self) -> bool:
        """Run all validations and print results."""
        print("🔍 Meta-Framework Validator — Prospector Edition\n")
        print(f"   Path: {self.base_path}\n")

        checks = [
            ("Duplicate docs/", self.validate_no_duplicate_docs),
            ("Index file", self.validate_index_exists),
            ("Key files", self.validate_key_files),
            ("Module existence", self.validate_modules_exist),
            ("Module headers", self.validate_headers),
            ("Dependencies", self.validate_dependencies),
        ]

        for name, check in checks:
            print(f"🔎 Checking {name}...")
            check()

        # Print summary
        print(f"\n{'='*60}")
        print(f"📊 VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"  Modules on disk:  {self.stats.get('total_disk', 0)}")
        print(f"  Modules in index: {self.stats.get('total_index', 0)}")
        print(f"  Valid headers:    {self.stats.get('valid_headers', 0)}")
        print(f"  Valid deps:       {self.stats.get('valid_deps', 0)}")
        print(f"  Errors:           {len(self.errors)}")
        print(f"  Warnings:         {len(self.warnings)}")

        if self.errors:
            print(f"\n❌ ERRORS:")
            for e in self.errors:
                print(f"   • {e}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS:")
            for w in self.warnings:
                print(f"   • {w}")

        if not self.errors:
            print(f"\n✅ ALL CHECKS PASSED — Framework is structurally valid!")
            return True
        else:
            print(f"\n❌ {len(self.errors)} ISSUES FOUND — See errors above")
            return False


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Validate meta-framework integrity')
    parser.add_argument('--path', default='docs/meta-framework', help='Path to meta-framework directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    args = parser.parse_args()

    validator = FrameworkValidator(args.path, verbose=args.verbose)
    success = validator.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()