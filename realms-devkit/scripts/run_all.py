#!/usr/bin/env python3
"""
Run all scripts in this directory in sequence (excludes self and checkpoint files).
Exit on first failure; cwd is set to devkit root so src and path hacks work.
"""
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEVKIT_ROOT = SCRIPT_DIR.parent


def main() -> None:
    scripts = []
    for p in sorted(SCRIPT_DIR.glob("*.py")):
        if p.name == "run_all.py":
            continue
        if "checkpoint" in p.name.lower() or ".ipynb_checkpoints" in str(p):
            continue
        scripts.append(p)

    if not scripts:
        print("No scripts to run.", file=sys.stderr)
        sys.exit(0)

    print(f"Running {len(scripts)} script(s) from {SCRIPT_DIR} (cwd={DEVKIT_ROOT})")
    for script in scripts:
        print(f"  -> {script.name}")
        r = subprocess.run(
            [sys.executable, str(script)],
            cwd=str(DEVKIT_ROOT),
        )
        if r.returncode != 0:
            print(f"Failed: {script.name} (exit {r.returncode})", file=sys.stderr)
            sys.exit(r.returncode)
    print("All scripts completed.")


if __name__ == "__main__":
    main()
