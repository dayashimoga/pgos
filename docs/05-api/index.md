# 🌐 REST & WebSocket API Documentation

## 1. Project API Endpoints
- **Create Project**: `POST /api/projects`
- **Compile Context**: `POST /api/context/compile`
- **Create Snapshot**: `POST /api/snapshot/create`
- **Rollback Snapshot**: `POST /api/recovery/rollback`
- **Run Validation**: `POST /api/validation/run`

## 2. Response Formats
```json
{
  "id": "proj001",
  "name": "guardian",
  "status": "synchronized"
}
```
