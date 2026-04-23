# FRONT-26 - Upload Pipeline

> **Prioridade:** MEDIO
> **Depende de:** BACK-04, BACK-05
> **É dependência de:** 30
> **Categoria:** frontend

## 1. Fluxo de Upload

```
Frontend          Backend           S3/MinIO          ClamAV
  │                 │                 │                │
  │ 1. Solicita     │                 │                │
  │ upload URL      │                 │                │
  │────────────────>│                 │                │
  │                 │ 2. Gera         │                │
  │                 │ presigned URL   │                │
  │                 │────────────────>│                │
  │                 │<────────────────│                │
  │ 3. URL + fields │                 │                │
  │<────────────────│                 │                │
  │                 │                 │                │
  │ 4. Upload direto│                 │                │
  │─────────────────────────────────>│                │
  │<─────────────────────────────────│                │
  │                 │                 │                │
  │ 5. Notifica     │                 │                │
  │ upload completo │                 │                │
  │────────────────>│                 │                │
  │                 │ 6. Scan malware │                │
  │                 │────────────────────────────────>│
  │                 │<────────────────────────────────│
  │                 │ 7. Marca file   │                │
  │                 │ como seguro     │                │
  │ 8. Confirmacao │                 │                │
  │<────────────────│                 │                │
```

**Por que presigned URL?**
- Backend NAO recebe arquivos (sem carga no servidor)
- Upload direto para S3 (mais rapido, mais escalável)
- URL expira em 15 min (seguranca)
- Backend controla permissoes

## 2. Configuracao S3/MinIO

### Bucket Structure

```
saas-uploads/
  ├── {tenant_id}/
  │   ├── {user_id}/
  │   │   ├── agents/
  │   │   │   └── {agent_id}/
  │   │   │       └── {uuid}.{ext}
  │   │   └── profile/
  │   │       └── avatar_{uuid}.{ext}
```

### Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::saas-uploads/*",
      "Condition": {
        "Bool": { "aws:SecureTransport": "false" }
      }
    }
  ]
}
```

## 3. Tipos e Limites

| Tipo | Extensao | Tamanho Max | Mime Type |
|------|----------|------------|-----------|
| Documento | .pdf, .txt, .csv, .json | 10MB | application/pdf, text/* |
| Imagem | .jpg, .png, .gif, .webp | 5MB | image/* |
| Dados | .json, .csv | 10MB | application/json, text/csv |

**Tipos bloqueados:** .exe, .bat, .sh, .js, .html, .svg (XSS), .zip, .rar

## 4. Endpoint: Gerar Presigned URL

### POST /v1/uploads/presign

```json
// Request
{
  "filename": "documento.pdf",
  "content_type": "application/pdf",
  "size": 2048576,
  "purpose": "agent_context"
}

// Response 200
{
  "success": true,
  "data": {
    "upload_url": "https://s3.region.amazonaws.com/saas-uploads/tenant/user/agents/uuid.pdf?X-Amz-...",
    "file_key": "tenant/user/agents/uuid.pdf",
    "file_id": "uuid",
    "expires_at": "2026-04-22T10:15:00Z",
    "max_size": 10485760
  }
}
```

**Validacoes:**
- content_type deve estar na allow list
- size <= 10MB
- purpose deve ser valido (agent_context, avatar, document)
- Usuario autenticado
- Rate limit: 10 uploads/min

### POST /v1/uploads/confirm

```json
// Request
{
  "file_id": "uuid"
}

// Response 200
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "file_key": "tenant/user/agents/uuid.pdf",
    "url": "https://cdn.dominio.com/uploads/tenant/user/agents/uuid.pdf",
    "status": "scanning"
  }
}
```

## 5. Implementacao Conceitual

### Upload Service

```typescript
class UploadService {
  ALLOWED_TYPES = new Map([
    ['application/pdf', '.pdf'],
    ['text/plain', '.txt'],
    ['text/csv', '.csv'],
    ['application/json', '.json'],
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/gif', '.gif'],
    ['image/webp', '.webp'],
  ])

  MAX_SIZE = 10 * 1024 * 1024 // 10MB

  async presign(userId: string, tenantId: string, data: PresignRequest): Promise<PresignResponse> {
    if (!this.ALLOWED_TYPES.has(data.content_type)) {
      throw new AppError('VALIDATION_FILE_TYPE', 400, `File type ${data.content_type} not allowed`)
    }

    if (data.size > this.MAX_SIZE) {
      throw new AppError('VALIDATION_FILE_TOO_LARGE', 400, `File exceeds maximum size of ${this.MAX_SIZE / 1024 / 1024}MB`)
    }

    const fileId = crypto.randomUUID()
    const ext = this.ALLOWED_TYPES.get(data.content_type)
    const key = `${tenantId}/${userId}/${data.purpose}/${fileId}${ext}`

    const presignedUrl = await s3Client.getPresignedUrl('PUT', key, {
      expiresIn: 900, // 15 min
      conditions: [
        ['content-length-range', 0, this.MAX_SIZE],
        ['starts-with', '$Content-Type', data.content_type],
      ],
    })

    return {
      upload_url: presignedUrl,
      file_key: key,
      file_id: fileId,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }
  }

  async confirm(fileId: string): Promise<ConfirmResponse> {
    const file = await prisma.uploadFile.findUnique({ where: { id: fileId } })
    if (!file) throw new AppError('SYS_NOT_FOUND', 404, 'File not found')

    await prisma.uploadFile.update({ where: { id: fileId }, data: { status: 'uploaded' } })

    // Async scan
    await scanQueue.add('scan', { fileId, key: file.fileKey })

    return { file_id: fileId, file_key: file.fileKey, status: 'scanning' }
  }
}
```

### Malware Scan (Async)

```typescript
import { execFile } from 'child_process'

async function scanFile(fileId: string, key: string): Promise<void> {
  // 1. Download do S3 para temporario
  const tmpPath = `/tmp/${fileId}`
  await s3Client.download(key, tmpPath)

  // 2. Scan com ClamAV
  try {
    await execAsync('clamdscan', [tmpPath])
    // Safe
    await prisma.uploadFile.update({ where: { id: fileId }, data: { status: 'safe' } })
  } catch {
    // Infected
    await s3Client.delete(key)
    await prisma.uploadFile.update({ where: { id: fileId }, data: { status: 'infected' } })
    await dlqService.enqueue('upload_scan', { fileId }, 'File failed malware scan')
  } finally {
    fs.unlinkSync(tmpPath)
  }
}
```

## 6. CDN para Download

```
Downloads NAO vem do S3 diretamente.
Vem via CDN (CloudFront ou Cloudflare):

Usuario → CDN → S3
         ↑
    Cache hit = rapido + barato
    Cache miss = lento mas so 1x
```

### Presigned Download URL

```typescript
async getDownloadUrl(key: string): Promise<string> {
  // Opcao 1: CDN URL (cacheavel)
  return `https://cdn.dominio.com/uploads/${key}`

  // Opcao 2: Presigned URL (private files)
  return await s3Client.getPresignedUrl('GET', key, { expiresIn: 900 })
}
```

## 7. Checklist

- [ ] Presigned URL para upload (nunca receber arquivo no backend)
- [ ] Allow list de tipos (MIME + extensao)
- [ ] Tamanho maximo 10MB
- [ ] URL expira em 15 min
- [ ] Confirmacao de upload (POST /uploads/confirm)
- [ ] Scan de malware assincrono (ClamAV ou servico)
- [ ] Arquivos infectados → deletar + marcar
- [ ] CDN para downloads
- [ ] Separacao por tenant_id/user_id
- [ ] Rate limit de upload (10/min)
- [ ] Cleanup de uploads nao confirmados (cron)