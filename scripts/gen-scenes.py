#!/usr/bin/env python3
"""Tulis ulang src/scenes/index.ts dan scripts/scene-files.ts dari daftar SCENES di bawah.
Adegan yang berkasnya belum ada memakai Placeholder."""
from pathlib import Path

SCENES = [
    ("hook", "Hook"), ("title", "Title"), ("roadmap", "Roadmap"), ("state", "State"), ("norm", "Norm"),
    ("superpos", "Superpos"), ("operator", "Operator"), ("eigen", "Eigen"), ("measure", "Measure"),
    ("expect", "Expect"), ("commute", "Commute"), ("tdse", "TDSE"), ("stationary", "Stationary"),
    ("pauli", "Pauli"), ("config", "Config"), ("bond", "Bond"), ("spectra", "Spectra"), ("mri", "MRI"),
    ("compchem", "CompChem"), ("qcomp", "QComp"), ("recap", "Recap"), ("outro", "Outro"),
]
root = Path(__file__).resolve().parent.parent
have = [(i, f) for i, f in SCENES if (root / "src/scenes" / f"{f}.tsx").exists()]
lines = ["import type React from 'react';"]
lines += [f"import {{{f}}} from './{f}';" for _, f in sorted(have, key=lambda x: x[1])]
lines += (["import {Placeholder} from './Placeholder';"] if len(have) < len(SCENES) else []) + ["", "// Pemetaan id scene di naskah → komponen visual.",
          "export const SCENES: Record<string, React.FC> = {"]
names = dict(have)
lines += [f"  {i}: {names.get(i, 'Placeholder')}," for i, _ in SCENES]
lines += ["};", ""]
(root / "src/scenes/index.ts").write_text("\n".join(lines))
sf = ["// id adegan → nama berkas komponen (untuk scripts/check-cues.ts)", "export const SCENES_FILE: Record<string, string> = {"]
sf += [f"  {i}: '{f}'," for i, f in have] + ["};", ""]
(root / "scripts/scene-files.ts").write_text("\n".join(sf))
print("adegan jadi:", len(have), "/", len(SCENES))
