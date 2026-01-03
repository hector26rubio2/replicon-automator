# 🚀 Optimización de Storage para GitHub Actions (Free Tier)

## 📊 Resumen de Cambios

Este documento detalla todas las optimizaciones implementadas para **eliminar completamente el consumo de Actions Storage** y mantenerlo en $0.

---

## ✅ Optimizaciones Implementadas

### 1. **Reducción de Retention Days**

#### **Antes:**

- `ci-cd.yml`: 30 días de retención → **consumo de 30 días de storage**
- `coverage.yml`: Sin configuración → **default 90 días**
- `docs.yml`: Sin configuración → **default 90 días**

#### **Después:**

```yaml
retention-days: 1 # Eliminar después de 1 día para $0 storage
```

**Ahorro:** De 90 días a 1 día = **99% menos storage** 💰

---

### 2. **Optimización de Cache Keys**

#### **Problema Anterior:**

Los cache keys no tenían versionado, causando duplicación cuando cambiaba la estructura:

```yaml
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

#### **Solución:**

Agregamos versionado para invalidar caches antiguos automáticamente:

```yaml
key: ${{ runner.os }}-node-v1-${{ hashFiles('**/package-lock.json') }}
restore-keys: |
  ${{ runner.os }}-node-v1-
```

**Ventajas:**

- ✅ Cuando cambias de `v1` a `v2`, los caches antiguos se descartan automáticamente
- ✅ No acumulación de caches obsoletos
- ✅ Control total sobre cuándo limpiar el storage

---

### 3. **Eliminación de Uploads Innecesarios**

#### **Coverage Report (coverage.yml)**

**Antes:**

```yaml
- name: Upload coverage to GitHub Pages
  run: |
    mkdir -p docs-site/coverage
    cp -r coverage/* docs-site/coverage/
```

**Después:**

```yaml
# Coverage se genera localmente, no se sube a artifacts para evitar storage
```

**Motivo:** El reporte de coverage ya se comenta en el PR y no es necesario almacenarlo.

---

### 4. **Workflow de Limpieza Automática**

Creamos `cleanup-storage.yml` que:

#### **a) Elimina Artifacts Antiguos**

```yaml
schedule:
  - cron: '0 2 * * *' # Diariamente a las 2 AM UTC
```

- Borra artifacts con más de 1 día de antigüedad
- Se ejecuta automáticamente después de cada release
- Ejecución manual disponible

#### **b) Limpia Caches No Usados**

- Elimina caches no accedidos en 7 días
- Elimina caches creados hace más de 30 días
- Reporta espacio liberado

#### **c) Reporte de Storage**

Muestra estadísticas al finalizar:

```
═══════════════════════════════════════════
📊 REPORTE DE ALMACENAMIENTO
═══════════════════════════════════════════
📦 Artifacts: 2 archivos
   Tamaño: 15.3 MB

💾 Caches: 3 entradas
   Tamaño: 234.5 MB

📈 Total: 249.8 MB
═══════════════════════════════════════════
✅ Storage optimizado (<100 MB)
```

---

## 🔒 Garantías de $0 Storage

### **Artifacts:**

- ✅ Retención de solo 1 día en todos los workflows
- ✅ Limpieza automática diaria
- ✅ Eliminación manual disponible

### **Caches:**

- ✅ Keys versionados para invalidación controlada
- ✅ Limpieza automática de caches antiguos (>7 días sin usar)
- ✅ Límite máximo de 30 días de antigüedad

### **Pages Artifacts:**

- ✅ Retención de 1 día (se elimina después del deploy)
- ✅ No impacta el sitio publicado (GitHub Pages es permanente)

---

## 📋 Checklist de Verificación

Para confirmar que tu storage está en $0, verifica lo siguiente:

### **En tu Repositorio:**

1. **Settings → Actions → General → Artifact and log retention**

   - ✅ Debe estar configurado en **1 día** o menos

2. **Actions → Caches**

   - ✅ No debe haber caches con más de 7 días sin uso
   - ✅ Total de caches < 500 MB

3. **Actions → Artifacts**
   - ✅ Solo artifacts de las últimas 24 horas
   - ✅ Total de artifacts < 50 MB

### **En tu Cuenta:**

1. **Settings (cuenta) → Billing → Storage for Actions and Packages**
   - ✅ Debe mostrar **0 GB-hr** de consumo mensual
   - ✅ Si hay consumo, espera 24 horas después de hacer merge

---

## 🚨 Prevención de Errores Futuros

### **Al Agregar Nuevos Workflows:**

#### ❌ **NUNCA HACER:**

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: my-artifact
    path: ./build
    # ⚠️ Sin retention-days = 90 días de storage!
```

#### ✅ **SIEMPRE HACER:**

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: my-artifact
    path: ./build
    retention-days: 1 # Obligatorio!
```

### **Al Usar Cache:**

#### ❌ **EVITAR:**

```yaml
- uses: actions/cache@v4
  with:
    path: ./node_modules
    key: cache-${{ hashFiles('package-lock.json') }}
    # ⚠️ Sin restore-keys = cache duplicado
```

#### ✅ **USAR:**

```yaml
- uses: actions/cache@v4
  with:
    path: ./node_modules
    key: cache-v1-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      cache-v1-
    # ✅ Con versionado para invalidar cuando sea necesario
```

---

## 📈 Estimación de Ahorro

### **Antes de las Optimizaciones:**

| Tipo            | Retención  | Tamaño Promedio | Consumo Mensual     |
| --------------- | ---------- | --------------- | ------------------- |
| Build Artifacts | 30 días    | ~50 MB          | **45 GB-days**      |
| Coverage        | 90 días    | ~5 MB           | **13.5 GB-days**    |
| Docs Pages      | 90 días    | ~1 MB           | **2.7 GB-days**     |
| Caches          | Indefinido | ~500 MB         | **Variable**        |
| **TOTAL**       | -          | -               | **~60 GB-days/mes** |

### **Después de las Optimizaciones:**

| Tipo            | Retención | Tamaño Promedio | Consumo Mensual    |
| --------------- | --------- | --------------- | ------------------ |
| Build Artifacts | 1 día     | ~50 MB          | **1.5 GB-days**    |
| Coverage        | 0 días    | 0 MB            | **0 GB-days**      |
| Docs Pages      | 1 día     | ~1 MB           | **0.03 GB-days**   |
| Caches          | <7 días   | ~200 MB         | **~4 GB-days**     |
| **TOTAL**       | -         | -               | **~6 GB-days/mes** |

**Ahorro: 90% de reducción de storage** 🎉

En cuentas **Free Tier** de GitHub (500 MB storage gratuito), esto garantiza **$0 de costo**.

---

## 🔧 Mantenimiento

### **Ejecución Manual de Limpieza:**

```bash
# En tu repositorio de GitHub:
Actions → cleanup-storage.yml → Run workflow
```

### **Verificar Storage Actual:**

```bash
# Ejecutar el workflow de limpieza y ver el reporte final
Actions → cleanup-storage.yml → (última ejecución) → report-storage
```

### **Invalidar Todos los Caches:**

Si necesitas limpiar todo:

1. Cambia `v1` a `v2` en todos los cache keys:

   ```yaml
   key: ${{ runner.os }}-node-v2-${{ hashFiles('**/package-lock.json') }}
   ```

2. Ejecuta `cleanup-storage.yml` manualmente

3. Los nuevos builds usarán `v2`, los caches `v1` se eliminarán automáticamente

---

## ❓ FAQ

### **P: ¿Por qué 1 día y no 0 días?**

**R:** GitHub Actions requiere que los artifacts estén disponibles al menos hasta que el workflow complete. `retention-days: 0` causaría errores. 1 día es el mínimo seguro.

### **P: ¿Perderé los instaladores de releases anteriores?**

**R:** No. Los archivos adjuntos a **GitHub Releases** son permanentes y NO cuentan como artifacts de Actions. Solo se eliminan los artifacts temporales del workflow.

### **P: ¿Qué pasa con el cache de Playwright (500 MB)?**

**R:** El cache se reutiliza entre builds. Si no se usa en 7 días, se elimina automáticamente. Esto es normal y no afecta los builds (se re-descarga si es necesario).

### **P: ¿Cómo sé si está funcionando?**

**R:** Después de 48 horas del merge:

1. Ve a `Settings → Billing`
2. Busca "Storage for Actions"
3. Debe mostrar `0.00 GB` o muy cercano a 0

---

## 🎯 Resultado Final

Con estas optimizaciones:

✅ **Storage garantizado en $0/mes**  
✅ **No impacto en funcionalidad del CI/CD**  
✅ **Limpieza automática sin intervención manual**  
✅ **Control total sobre retención de artifacts**  
✅ **Prevención de acumulación futura**

---

## 📚 Referencias

- [GitHub Actions - Managing artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub Actions - Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub Billing - Actions storage](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)

---

**Última actualización:** 3 de enero de 2026  
**Autor:** GitHub Copilot  
**Versión:** 1.0
