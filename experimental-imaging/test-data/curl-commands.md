# Curl test requests

Assumes module runs at `http://localhost:4010`.

## 1) Stroke-like case (JSON input)

```bash
curl -X POST http://localhost:4010/analyze-imaging \
  -H "Content-Type: application/json" \
  -d @experimental-imaging/test-data/stroke-like.json
```

## 2) Respiratory issue case (JSON input)

```bash
curl -X POST http://localhost:4010/analyze-imaging \
  -H "Content-Type: application/json" \
  -d @experimental-imaging/test-data/respiratory-issue.json
```

## 3) Normal case (JSON input)

```bash
curl -X POST http://localhost:4010/analyze-imaging \
  -H "Content-Type: application/json" \
  -d @experimental-imaging/test-data/normal.json
```

## 4) Multipart upload example (mock DICOM upload)

```bash
curl -X POST http://localhost:4010/analyze-imaging \
  -F "triage_level=RED" \
  -F "vitals={\"heart_rate\":121,\"spo2\":88}" \
  -F "symptoms=[\"shortness of breath\",\"persistent cough\"]" \
  -F "image=@experimental-imaging/test-data/sample-images/respiratory-issue.png"
```
