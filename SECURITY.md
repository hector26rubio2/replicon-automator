# Security Policy

## Reportar Vulnerabilidades de Seguridad

Si descubres una vulnerabilidad de seguridad en **Replicon Automator**, por favor repórtala de forma responsable:

### 🔒 Reporte Privado (Recomendado)

1. Ve a la pestaña [Security](https://github.com/hector26rubio2/replicon-automator/security)
2. Click en "Report a vulnerability"
3. Completa el formulario con:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducirla
   - Impacto potencial
   - Posible solución (si la conoces)

### 📧 Contacto Directo

Si no puedes usar GitHub Security Advisories, envía un correo a:
**[TU_EMAIL_AQUÍ]**

Por favor **NO** reportes vulnerabilidades de seguridad en Issues públicos.

## 🛡️ Versiones Soportadas

| Versión | Soporte          |
| ------- | ---------------- |
| 3.x     | ✅ Activamente   |
| 2.x     | ⚠️ Solo críticas |
| < 2.0   | ❌ No soportado  |

## 🔐 Mejores Prácticas de Seguridad

### Para Usuarios

- ✅ Descarga **únicamente** desde [GitHub Releases oficial](https://github.com/hector26rubio2/replicon-automator/releases)
- ✅ Verifica la firma digital del instalador (próximamente)
- ✅ Mantén la aplicación actualizada
- ✅ No compartas tus credenciales de Replicon
- ❌ NO descargues de sitios de terceros

### Para Desarrolladores

- ✅ Usa `npm audit` regularmente
- ✅ Mantén dependencias actualizadas vía Dependabot
- ✅ Las credenciales **NUNCA** se almacenan en texto plano
- ✅ Usa GitHub Secrets para claves de API en CI/CD
- ✅ Habilita 2FA en tu cuenta de GitHub

## 📊 Auditorías Automáticas

Este proyecto usa:

- **Dependabot**: Detecta y notifica vulnerabilidades en dependencias
- **npm audit**: Se ejecuta en cada build de CI/CD
- **CodeQL** (próximamente): Análisis estático de código

## 🚨 Respuesta a Incidentes

Tiempo de respuesta estimado:

- **Crítico**: 24 horas
- **Alto**: 72 horas
- **Medio**: 1 semana
- **Bajo**: 2 semanas

## 🙏 Agradecimientos

Agradecemos a todos los investigadores de seguridad que reporten vulnerabilidades de forma responsable.
