# Generar APK Android - YachtDaywork

## Requisito previo: expo-notifications en la raíz

Como `mobile/` está dentro del monorepo, Expo resuelve plugins desde la raíz. Instala en la raíz:

```powershell
cd C:\MyApp\myapp\mi-marketplace
npm install expo-notifications@~0.32.16 --save-dev
```

---

## Orden de pasos

### 1. Dependencias en mobile
```powershell
cd C:\MyApp\myapp\mi-marketplace\mobile
npm install
```

### 2. Prebuild
```powershell
npx expo prebuild --platform android
```

### 3. Build de la APK (forzar uso de mobile/node_modules)
```powershell
$env:NODE_PATH = "$(Get-Location)\node_modules"
$env:NODE_ENV = "production"
cd android
.\gradlew assembleRelease
```

### 4. Ubicación de la APK
```
mobile\android\app\build\outputs\apk\release\app-release.apk
```

---

## Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Failed to resolve plugin for expo-notifications` | Expo usa node_modules de la raíz | `npm install expo-notifications --save-dev` en la **raíz** del proyecto |
| `No matching variant... react-native-safe-area-context` | Gradle usa node_modules de la raíz en lugar de mobile | `$env:NODE_PATH="ruta\mobile\node_modules"` antes de gradlew |
| `NODE_ENV is required` | Variable no definida | `$env:NODE_ENV="production"` antes de gradlew |
| `EBUSY: resource busy or locked` | Gradle daemon u otro proceso bloquea la carpeta | Cierra Android Studio, ejecuta `.\gradlew --stop` en android/, e intenta de nuevo |
| `Daemon will expire... JVM Metaspace` | Memoria insuficiente | Ya ajustado en gradle.properties (4GB heap, 1GB metaspace) |

---

## Comando único (desde mobile/)

```powershell
cd C:\MyApp\myapp\mi-marketplace\mobile
npm install
npx expo prebuild --platform android
$env:NODE_ENV="production"; cd android; .\gradlew assembleRelease
```
