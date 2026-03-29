# 🔐 Guía de Autenticación - Admin Panel

## Local Development

Las credenciales están configuradas en `.env.local` (NO se sincroniza con Git):

```
VITE_ADMIN_USER=rickbyll
VITE_ADMIN_PASS=Jrcn112928*
VITE_TOKEN_EXPIRY_DAYS=30
```

**⚠️ Importante:** Nunca commitees el archivo `.env.local` a Git.

---

## Características de Seguridad

✅ **Token con expiración:** 30 días (configurable)  
✅ **localStorage seguro:** Token se almacena con timestamp  
✅ **Variables de entorno:** Credenciales no en código fuente  
✅ **Botón admin oculto:** Solo visible si tienes sesión válida  
✅ **Alerta de expiración:** Notificación cuando token vence  

---

## Vercel Deployment

### 1. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añade estas variables:

```
VITE_ADMIN_USER=     (tu usuario)
VITE_ADMIN_PASS=     (tu contraseña segura)
VITE_TOKEN_EXPIRY_DAYS=30
```

**Selecciona:** Production, Preview, Development

### 2. Deploy

```bash
git push origin main
```

Vercel automáticamente desplegará con las variables de entorno configuradas.

---

## Comportamiento

| Acción | Resultado |
|--------|-----------|
| **Sin token válido** | Botón admin oculto, solo ves el portfolio |
| **Login correcto** | Token se almacena (30 días válido) |
| **Token expirado** | Alerta amarilla en login, necesitas re-login |
| **Cerrar sesión** | Token se elimina de localStorage |
| **Recargar página** | Token persiste si es válido |

---

## Cambiar Contraseña

En Vercel:
1. Settings → Environment Variables
2. Actualiza `VITE_ADMIN_PASS` con la nueva contraseña
3. El cambio toma efecto en la siguiente búsqueda (redeploy automático)

O en local: Edita `.env.local` y reinicia el servidor

---

## Preguntas Frecuentes

**¿Dónde se guardaban mis datos antes?**  
En `localStorage` del navegador. Sigue siendo así. Solo la autenticación usa token.

**¿Mi contraseña está segura en Vercel?**  
Sí, Vercel encripta todas las env vars. Son privadas.

**¿Qué pasa si pierdo acceso?**  
Contacta a Vercel o accede localmente con `.env.local`.

**¿El token se congela después de 30 días?**  
Sí, la próxima vez que intentes entrar, mostrará alerta de expiración.

---

## Soporte

- `.env.local` no debe estar en .gitignore (ya está configurado)
- Si ocurren errores, revisa la consola del navegador
- Las variables env están disponibles vía `import.meta.env.VITE_*`
