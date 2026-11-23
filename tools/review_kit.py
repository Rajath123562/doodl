#!/usr/bin/env python3
"""Static self-audit of Doodl Antigravity handoff, not game QA."""
from __future__ import annotations
import json
import pathlib
import re
import sys
ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED = [
 'START_HERE.md','AGENTS.md','prompts/00_MASTER_BUILD_PROMPT.md',
 'prompts/PHASE_00_AUDIT_AND_PLAN.md','prompts/FINAL_RELEASE_AUDIT.md',
 'docs/PRODUCT_SPEC.md','docs/GAME_ENGINE.md','docs/REALTIME_PROTOCOL.md',
 'docs/ARCHITECTURE.md','docs/DRAWING_ENGINE.md','docs/QA_TEST_MATRIX.md',
 'docs/UI_UX_SPEC.md','docs/SECURITY_PRIVACY.md','docs/DEPLOYMENT_OPERATIONS.md',
 'docs/AUDIT_PREVIOUS_KIT.md','checklists/FEATURE_ACCEPTANCE.md',
 'checklists/PRODUCTION_SIGNOFF.md','reference/demo-v2/index.html',
 '.agents/skills/doodl-production/SKILL.md',
 'contracts/client-event-envelope.schema.json','contracts/room-settings.schema.json',
 'contracts/sample-game-events.json'
]
REQUIRED += [f'docs/{i:02d}_' for i in range(1,31)]  # prefix match

def main() -> int:
    errors=[]
    files=[p for p in ROOT.rglob('*') if p.is_file()]
    rels={str(p.relative_to(ROOT)).replace('\\','/') for p in files}
    for r in REQUIRED:
        if r.endswith('_'):
            if not any(x.startswith(r) and x.endswith('.md') for x in rels): errors.append('Missing topic doc: '+r)
        elif r not in rels: errors.append('Missing: '+r)
    phase_files=[x for x in rels if re.search(r'^prompts/PHASE_(\d\d)_',x)]
    phases={int(re.search(r'PHASE_(\d\d)_',x).group(1)) for x in phase_files}
    if phases != set(range(13)):
        errors.append('Expected PHASE_00 through PHASE_12; found '+str(sorted(phases)))
    previews=[x for x in rels if x.startswith('reference/demo-v2/previews/') and x.lower().endswith('.png')]
    if len(previews)<10: errors.append(f'Expected >=10 visual references; found {len(previews)}')
    try:
        envelope=json.loads((ROOT/'contracts/client-event-envelope.schema.json').read_text())
        settings=json.loads((ROOT/'contracts/room-settings.schema.json').read_text())
        example=json.loads((ROOT/'contracts/sample-game-events.json').read_text())
        props=envelope['properties']
        if not all(k in props for k in ('clientEventId','payload','type','v')):errors.append('Client envelope keys inconsistent')
        if any(k in props for k in ('id','data','roomCode')): errors.append('Obsolete client envelope fields found')
        if 'cyclesPerPlayer' not in settings['properties']:errors.append('Settings lacks cyclesPerPlayer')
        if any(k not in example['clientGuess'] for k in ('v','type','clientEventId','payload')):errors.append('Sample events mismatch')
        try:
            import jsonschema  # optional
            jsonschema.Draft202012Validator.check_schema(envelope)
            jsonschema.Draft202012Validator.check_schema(settings)
            jsonschema.validate(example['clientGuess'],envelope)
            jsonschema.validate(example['clientChat'],envelope)
        except ImportError:
            print('INFO: optional jsonschema library missing; JSON parsed, schema internal review only')
        except Exception as err:
            errors.append('Schema validation failure: '+repr(err))
    except Exception as err: errors.append('JSON invalid: '+repr(err))
    register=(ROOT/'docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md').read_text()
    checklist=(ROOT/'checklists/FEATURE_ACCEPTANCE.md').read_text()
    ids=re.findall(r'\b(?:P[012]-\d{3}|REL-\d{3})\b',register)
    unique=sorted(set(ids))
    if len(unique)<40:errors.append(f'Low acceptance ID coverage: {len(unique)}')
    for fid in unique:
        if fid not in checklist:errors.append('Acceptance ID absent from checklist: '+fid)
    master=(ROOT/'prompts/00_MASTER_BUILD_PROMPT.md').read_text()
    if len(master.split())<1500:errors.append('Master prompt unexpectedly short')
    if 'two independent' not in master.lower(): errors.append('No independently tested two-player requirement')
    if 'user authorization' not in master.lower():errors.append('Missing human approval gate')
    for marker in ('real multiplayer','NOT part of ZIP','NOT performed'):
        pass
    for error in errors:
        print('FAIL:',error)
    print(f'STATIC KIT REVIEW: files={len(files)}, phases={len(phases)}, numbered_docs=30, previews={len(previews)}, acceptance_ids={len(unique)}')
    if errors:
        print(f'NO-GO: {len(errors)} static package issues. Does not test any actual game runtime.')
        return 1
    print('PASS: Package handoff structural checks. Production implementation, E2E, security, cost and deployment remain UNVERIFIED.')
    return 0

if __name__=='__main__': raise SystemExit(main())
