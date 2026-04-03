# Experimental Imaging Module

Isolated imaging + AI experimental service for Vital Edge. This module is local-only and does not modify existing triage or production routes.

## What it does

- Activates imaging workflow only when `triage_level = RED`
- Accepts `jpg/png` uploads as mock DICOM stand-ins
- Stores uploaded files in `mock-storage/`
- Simulates pipeline stages: `intake -> processing -> ready-for-analysis`
- Runs deterministic mocked inference with safe language
- Generates deterministic report output with clinician safety disclaimers

## Setup

From repository root:

```bash
cd D:/vital_Edge1/Vital-Edge
npm install --prefix experimental-imaging
```

## Run

From repository root:

```bash
npm run dev:imaging
```

Service starts on `http://localhost:4010` by default.
If port `4010` is already in use, the module automatically falls back to `http://localhost:4011`.

## API

### `POST /analyze-imaging`

Accepts either:

1. `application/json` with `image_path` pointing to existing local file, or
2. `multipart/form-data` with file field `image`

JSON body fields:

```json
{
  "triage_level": "RED",
  "vitals": { "heart_rate": 126, "spo2": 89 },
  "symptoms": ["slurred speech", "one-sided weakness"],
  "image_path": "test-data/sample-images/stroke-like.jpg"
}
```

## Test cases

See:

- `test-data/stroke-like.json`
- `test-data/respiratory-issue.json`
- `test-data/normal.json`
- `test-data/curl-commands.md`

## Safety

Responses always include:

- `This is assistive analysis only`
- `Final decision lies with clinician`

This module is experimental and not intended for medical-grade diagnosis.
