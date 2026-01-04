# file-uploads

Servicio en Node.js + TypeScript para subir, organizar y servir imágenes.

- Autor: Kristian Orozco
- Versión: 1.0.0

Características iniciales:
- Express + TypeScript
- Validación básica y seguridad (helmet, cors, rate-limit)
- Uploads locales organizados por proyecto en `storage/{projectId}`
- URLs firmadas para acceso público (con token)

Siguiente pasos: implementar endpoints de upload, validación por proyectos, signed URLs y pruebas.

---

## CI / CD (GitHub Actions) ✅

He incluido un workflow de ejemplo en `.github/workflows/ci-cd.yml` con los siguientes comportamientos:

- `test` (se ejecuta en `push` y `pull_request` contra `main`): instala dependencias, ejecuta `lint`, `build` y `test`. Esto asegura que **los tests siempre pasen** antes de permitir un deploy.
- `deploy` (se ejecuta en `push` a `main`): empaqueta el build (dist + node_modules) y lo copia por SSH al servidor; luego ejecuta comandos remotos para instalar depencias (usa Bun si está disponible), y reinicia el servicio systemd.
- `buildpacks (optional)`: un job opcional que usa **Paketo / buildpacks** para crear una imagen OCI si activas `ENABLE_BUILDPACK` en los Secrets.

Secrets que requiere el workflow (configurar en GitHub):
- `SSH_PRIVATE_KEY` — clave privada para copiar/desplegar
- `SSH_USER` — usuario remoto
- `SSH_HOST` — host o IP del servidor
- `SSH_PORT` — puerto SSH (opcional; default 22)
- `APP_DIR` — directorio en el servidor (ej. `/opt/file-uploads`)
- `SERVICE_NAME` — nombre systemd del servicio (ej. `file-uploads`)
- `ENABLE_BUILDPACK` — (opcional) `true` para activar el job de Paketo build

### Archivos útiles añadidos
- `deploy/systemd/file-uploads.service` — ejemplo de unit systemd para Ubuntu (usa `/opt/file-uploads/.env` para configuración)
- `scripts/setup-server.sh` — script de ayuda para preparar el servidor (instalar Bun/Node, instrucciones)

Configuración del puerto
- El servicio usa por defecto el puerto **5500**. Puedes cambiar el puerto editando `/opt/file-uploads/.env` y estableciendo `PORT` a `5500`, `5000`, `8888`, o el que prefieras.
- La configuración se aplica automáticamente desde el archivo `.env` en el directorio de la aplicación; el `systemd` unit ya carga ese archivo con `EnvironmentFile`.

Si quieres, puedo:
- Activar el job de Paketo y probar un build de ejemplo (requiere registry/config).
- Crear una job `staging` para despliegues en rama distinta a `main`.

He dejado el puerto por defecto en **5500** y el nombre del servicio por defecto es **file-uploads**. Si quieres otro valor, dime cuál y lo actualizo en los artefactos y la documentación.
