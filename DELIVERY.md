# Entrega técnica — File Uploads (Servicio de imágenes)

Este documento describe el sistema a nivel funcional, cómo integrarlo en otro proyecto y cómo operarlo en producción.

## Resumen ejecutivo
- Servicio: API para subir, organizar y servir imágenes por proyecto.
- Lenguaje: TypeScript (Node.js)
- Framework: Express
- Almacenamiento: sistema de archivos local (ruta configurable), metadatos en SQLite cuando está disponible y fallback a JSON (`data.json`).
- Autenticación: JWT (admin tokens) para acciones administrativas; signed URLs (JWT) para servir imágenes públicamente por tiempo limitado.

---

## Funcionalidades principales

- Autenticación ADMIN:
  - `POST /auth/login` — acepta `username` y `password`.
    - Primero intenta autenticar contra usuarios guardados en la DB (`users` con `password_hash` bcrypt).
    - Si no encuentra el usuario en DB, hace fallback a variables de entorno (`ADMIN_USER`, `ADMIN_PASSWORD`).
  - Respuesta: `{ token: string }` (JWT, rol `admin`, 7 días de expiración).

- Gestión de Projects:
  - `GET /projects` — lista proyectos (incluye fallback a `config/projects.json`).
  - `POST /projects` — crear proyecto (protegido por token admin).
  - `GET /projects/:slug` — obtener proyecto por slug.
  - `DELETE /projects/:id` — soft delete (marca `status='deleted'`).

- Upload de imágenes:
  - `POST /upload` (admin): multipart/form-data con `file` y `projectId` o `projectSlug`.
  - Validaciones:
    - Tamaño máximo configurable (`MAX_UPLOAD_SIZE_BYTES`, por defecto 5MB).
    - Verificación por "magic bytes" (PNG, JPG, GIF, WEBP) además de extensión.
    - ProjectId/Slug deben existir (se valida contra DB o `config/projects.json`).
  - Almacenamiento: `storage/{projectId}/{YYYY}/{MM}/{DD}/{uuid}.{ext}`.
  - Metadatos guardados en la DB (`images` table) o en `data.json` cuando no hay SQLite.

- Listado y búsqueda de imágenes:
  - `GET /images` — filtros: `projectId`, `q` (busca por original name o filename), `limit`, `offset`.
  - `GET /images/:id` — sirve imagen si se proporciona `?token=<signed-token>` válido.

- Signed URLs para acceso público:
  - `POST /images/:id/sign` — genera JWT con tiempo de expiración corto y devuelve `{ token, url }`.
  - `GET /images/:id?token=...` — valida token y devuelve el binario con `Content-Type` correcto.

---

## Esquemas (entrada / salida) — Resumen
- AuthRequest: `{ username: string, password: string }` => AuthResponse: `{ token: string }`
- ProjectCreateRequest: `{ name: string, slug?: string, description?: string }` => Project
- Upload: multipart/form-data `{ file: binary, projectId?: string, projectSlug?: string }` => ImageResponse `{ id, projectId, filename }`
- ImageListResponse: `{ items: ImageResponse[], total?: number }`
- SignedUrlResponse: `{ token: string, url: string }`
(Ver `src/docs/openapi.json` para el spec completo OpenAPI 3.0)

---

## Almacenamiento y persistencia
- Archivos: guardados en el filesystem de la máquina donde corre la app bajo `storage/` (estructura por proyecto y fecha).
- Metadatos (images, projects, users): preferentemente en SQLite (`data.sqlite`), si el entorno no permite instalar native modules se usa `data.json` como fallback. El código incluye helpers que trabajan para ambos casos.
- Nota: cuando uses `data.json` en entornos con múltiples instancias, **no** compartir `data.json` en un storage compartido concurrente; preferir SQLite o DB centralizada.

---

## Seguridad y manejo de secretos
- Secretos y configuración por variables de entorno (no checkeadas en repo):
  - `JWT_SECRET` — secreto para firmar tokens (defecto inseguro para desarrollo, cambiar en producción).
  - `ADMIN_USER`, `ADMIN_PASSWORD` — fallback para admin (mejor usar users en DB con hashes).
  - `TEST_ADMIN_PASSWORD` — usado en tests localmente cuando se necesita una contraseña fija.
- No subir contraseñas en texto plano. Para crear admins usar `scripts/seed-admin.js` con env vars o parámetros.
- Los signed URLs usan JWT con tiempo corto; el servicio comprueba expiración antes de servir.

---

## Scripts útiles
- `npm run dev` — arranca en modo desarrollo (ts-node-dev).
- `npm run build` — compila el proyecto.
- `npm test` — ejecuta los tests.
- `npm run seed-admin` — ejecuta `scripts/seed-admin.js` (usa `ADMIN_USER` y `ADMIN_PASSWORD` o args posicionales).
- `npm run docs` — placeholder para generación/actualización del spec (por ahora usa `src/docs/openapi.json`).

---

## Integración (cómo consumir la API desde otro proyecto)
1. **Autenticación admin**
   - Llamar a `POST /auth/login` con credenciales (env o user creado con seed) y recibir token JWT.
   - Pasar header `Authorization: Bearer <token>` en las llamadas protegidas (crear proyecto, upload).

2. **Subir una imagen (ejemplo curl)**

```bash
curl -X POST "http://localhost:5500/upload" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "projectSlug=project-a" \
  -F "file=@/path/to/img.png"
```

3. **Generar signed URL e integrar en frontend**

```bash
curl -X POST "http://localhost:5500/images/<id>/sign" -H "Authorization: Bearer $ADMIN_TOKEN"
# respuesta: { token, url }
# En el frontend consumir 'url' (ya contiene el token como query) o adjuntar token como query param:
# GET /images/<id>?token=<token>
```

---

## Despliegue y operación
- El repo incluye ejemplos para un deploy simple en Ubuntu con systemd (`deploy/systemd/file-uploads.service`) y un script de preparación (`scripts/setup-server.sh`).
- Configurar `.env` en el servidor: `PORT`, `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`, `DB_PATH` (opcional), `MAX_UPLOAD_SIZE_BYTES`, `PUBLIC_HOST`.
- Recomendaciones: montar `storage/` en un volumen persistente; si necesitas alta disponibilidad, considera migrar metadatos a un DB central (Postgres) y usar S3 o similar para archivos.

---

## Tests y CI
- Tests: Jest + Supertest. Ejecutar `npm test` en CI.
- GitHub Actions: ya configura jobs de `test` y `deploy` (SSH) en `.github/workflows/ci-cd.yml`.

---

## Checklist para entregar a un equipo de integración
- [ ] Proporcionar `JWT_SECRET` y credenciales admin (preferiblemente crear usuario DB con `scripts/seed-admin.js` y compartir `ADMIN_USER` solo por canal seguro).
- [ ] Asegurar que `storage/` está disponible y con permisos adecuados en el servidor.
- [ ] Añadir valores de `env` en `/opt/file-uploads/.env` en el servidor.
- [ ] Revisar política de retención y backups para `storage/` y `data.sqlite`.

---

## Contacto y notas finales
- Autor: Kristian Orozco
- Si quieres que lo empaquete en una imagen Docker o despliegue un ejemplo en staging, puedo hacerlo como siguiente paso.

