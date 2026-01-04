# Deployment en Dokploy

Este documento explica cómo deployar correctamente este proyecto en Dokploy.

## Configuración de Build Type

1. En Dokploy, selecciona **Nixpacks** como Build Type
2. El archivo `nixpacks.toml` en la raíz del proyecto está configurado para usar Bun

## Variables de Entorno Requeridas

Configura las siguientes variables de entorno en Dokploy:

```env
# Puerto de la aplicación
PORT=5500

# Entorno de Node.js
NODE_ENV=production

# Secret para JWT (CAMBIA ESTO por un valor seguro)
JWT_SECRET=tu-secret-super-seguro-aqui

# Host público para generar URLs firmadas
PUBLIC_HOST=https://tu-dominio.com

# Rutas para datos persistentes (usando volúmenes de Dokploy)
DB_PATH=/data/db.sqlite
STORAGE_PATH=/data/storage

# Credenciales de admin (CAMBIA ESTO)
ADMIN_USER=admin
ADMIN_PASSWORD=tu-password-seguro-aqui
```

## Configuración de Volúmenes

Asegúrate de tener configurados los siguientes volúmenes en Dokploy:

| Mount Type | Volume Name | Mount Path     |
|------------|-------------|----------------|
| VOLUME     | DB          | /data          |
| VOLUME     | Storage     | /data/storage  |

⚠️ **Importante**: Después de agregar, editar o eliminar volúmenes, debes hacer clic en "Redeploy" para aplicar los cambios.

## Verificación del Deployment

1. Revisa los logs en tiempo real en la sección "Logs" de Dokploy
2. Deberías ver mensajes como:
   ```
   Creating directory: /data
   Creating directory: /data/storage
   All required directories are ready
   DB backend: sqlite (o "DB fallback: using JSON file at...")
   Server listening on port 5500
   ```

## Troubleshooting

### El contenedor se reinicia constantemente

**Causa**: La aplicación está crasheando al iniciar.

**Solución**:
1. Verifica los logs en Dokploy
2. Asegúrate de que las variables de entorno estén configuradas correctamente
3. Verifica que los volúmenes estén montados correctamente
4. Haz "Redeploy" después de cualquier cambio en volúmenes

### Error: Cannot find module

**Causa**: El build no se completó correctamente.

**Solución**:
1. Verifica que Nixpacks esté seleccionado como Build Type
2. Revisa los logs de build para ver si hay errores
3. Haz un "Rebuild" desde cero

### Las imágenes subidas no persisten

**Causa**: El volumen de storage no está configurado correctamente.

**Solución**:
1. Verifica que `STORAGE_PATH=/data/storage` esté configurado
2. Verifica que el volumen esté montado en `/data/storage`
3. Haz "Redeploy" después de configurar el volumen

### No puedo hacer login

**Causa**: Las credenciales de admin no están configuradas.

**Solución**:
1. Verifica que `ADMIN_USER` y `ADMIN_PASSWORD` estén configurados
2. Usa esas credenciales para hacer login en `/auth/login`

## Endpoints de Verificación

- `GET /health` - Verifica que la aplicación esté corriendo
- `GET /` - Devuelve `{"ok": true}` si todo está bien
- `POST /auth/login` - Login con credenciales de admin

## Comandos Útiles (si tienes acceso al servidor)

```bash
# Ver logs del contenedor
docker logs -f <container-id>

# Inspeccionar el contenedor
docker inspect <container-id>

# Verificar volúmenes montados
docker exec <container-id> ls -la /data

# Verificar que el directorio de storage exista
docker exec <container-id> ls -la /data/storage
```
