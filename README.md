# Oficios Ahome 🛠️🇲🇽

> **Directorio cívico, mapa interactivo y plataforma comunitaria de código abierto para el Municipio de Ahome, Sinaloa.**  
> Conexión directa Persona a Persona (P2P) vía WhatsApp y llamada telefónica. Cero comisiones, cero intermediarios, acceso garantizado sin internet (PWA) y 100% gratuito para siempre.

Una iniciativa de software cívico e impacto social desarrollada por **[PolyLab Studio](https://polylab-web-cliente.onrender.com/)** — **Ramsses García** en Los Mochis, Sinaloa.

---

[![Dominio Oficial](https://img.shields.io/badge/Web%20App-oficiosahome.org-09090B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://oficiosahome.org/)
[![GitHub Actions CI](https://img.shields.io/badge/Data%20Sync-Daily%20Cron-18181B?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/MrDetan/oficios-ahome/actions)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First%20v4.0-09090B?style=for-the-badge&logo=pwa&logoColor=white)](https://oficiosahome.org/)
[![Zero Backend](https://img.shields.io/badge/Backend-Serverless%20Google%20Sheets-27272A?style=for-the-badge&logo=google-sheets&logoColor=white)](https://sheets.new)
[![Open Source](https://img.shields.io/badge/License-MIT%20Civic-52525B?style=for-the-badge&logo=open-source-initiative&logoColor=white)](./LICENSE)
[![Data Quality](https://img.shields.io/badge/Oficios%20Verificados-288%20(100%25)-09090B?style=for-the-badge)](./scripts/validate-data.js)

---

## 🔬 Acerca de PolyLab Studio

**PolyLab** es un estudio mexicano independiente de **diseño, fabricación aditiva y software cívico**, nacido en Los Mochis, Sinaloa. No nos entendemos como un simple servicio de impresión ni como una tienda genérica de souvenirs: somos una **marca de diseño contemporáneo** que utiliza la tecnología para crear objetos y soluciones que combinan **arte, funcionalidad, geometría y estética**.

> *“Un lugar donde creamos cosas para mundos que aún no existen.”*

**Oficios Ahome** nace como el brazo de **responsabilidad social y tecnología cívica** de PolyLab: aplicamos exactamente el mismo rigor de ingeniería, diseño editorial monocromático y optimización de producto que usamos en el laboratorio para construir herramientas digitales útiles y gratuitas que beneficien a nuestro municipio.

---

## ✨ Características Principales de la Plataforma

### 🗺️ 1. Mapa Cívico Interactivo con Agrupamiento Inteligente
- **OpenStreetMap + Leaflet.js:** Cero costos de API keys (sin Google Maps API).
- **Marker Clustering (`Leaflet.markercluster`):** Agrupa automáticamente los 288 oficios en burbujas numéricas interactivas para evitar saturación de pantalla al hacer zoom out.
- **Distribución Orbital Anti-Superposición:** Distribuye a los trabajadores de una misma colonia en radios calculados mediante trigonometría para que ningún marcador tape a otro.
- **Selector de Ubicación con Pin Arrastrable & GPS:** Permite a nuevos trabajadores posicionar su taller o cobertura con precisión métrica.

### ⚡ 2. Modo Sin Conexión Garantizado (PWA Offline v4.0)
- **Service Worker con Estrategia Stale-While-Revalidate:** Guarda la base de datos completa (`oficios.json`), todas las páginas y fotos en el almacenamiento local del teléfono.
- **Llamadas Celulares Directas sin Datos:** Si te quedas sin megas en la calle o hay fallas de red, puedes abrir la app y presionar **"Llamar"** para comunicarte por la red celular tradicional (GSM/VoLTE).

### 🤖 3. Sincronización Automática con GitHub Actions
- **Pipeline Diario:** Un flujo automatizado consulta el webhook de Google Sheets a medianoche, valida el esquema de datos con `scripts/validate-data.js` y actualiza el repositorio sin intervención manual.

### 💬 4. Trato Directo Persona a Persona (P2P)
- **Cero comisiones ni intermediarios:** El precio, alcance y pago se acuerdan directamente entre cliente y prestador.
- **Compartir por WhatsApp con 1 Toque:** Enlace directo con formato enriquecido para recomendar trabajadores a vecinos y familiares.

### 📇 5. Guardar en Contactos (vCard 3.0 Offline)
- Genera dinámicamente archivos `.vcf` en memoria del navegador (`Blob`) para añadir al plomero, electricista o cerrajero a la agenda nativa del celular con un solo toque.

### 🖨️ 6. Carteles Comunitarios Imprimibles con Código QR
- Generador de pósteres vecinales para pegar en tiendas de abarrotes, postes o casetas.
- Integra `qrcode.min.js` localmente para funcionar 100% sin internet. Estilos `@media print` optimizados en alto contraste y blanco/negro.

### 🚨 7. Modo Auxilio Nocturno 24 Horas
- Filtro de un solo toque que aísla de inmediato a prestadores con disponibilidad de urgencias nocturnas (fugas de agua, cortos eléctricos, cerrajería automotriz).

### ⭐ 8. Mis Oficios de Confianza (Favoritos)
- Sistema de guardado local persistente en `localStorage` para tener a la mano a tus trabajadores recomendados sin necesidad de crear cuentas.

---

## 📁 Estructura del Repositorio

```text
Barrio/
├── .github/
│   ├── workflows/
│   │   └── sync-sheets.yml      # Sincronización diaria automatizada con GitHub Actions
│   └── ISSUE_TEMPLATE/          # Plantillas de reporte de número inactivo y propuesta de oficios
├── scripts/
│   └── validate-data.js         # Validador de calidad y esquema de datos (Linter)
├── index.html                   # Directorio principal, mapa Leaflet y buscador
├── sobre-nosotros.html          # Historia, manifiesto PolyLab y narrativa en 1ª persona
├── terminos-y-privacidad.html   # Marco legal cívico, deslinde y Derechos ARCO (LFPDPPP)
├── app.js                       # Lógica reactiva PWA, geolocalización, clustering y filtros
├── sw.js                        # Service Worker v4.0 para funcionamiento sin conexión
├── manifest.json                # Manifiesto PWA para instalación en Android, iOS y PC
├── oficios.json                 # Base de datos local (288 oficios en 7 sindicaturas)
├── google-apps-script.js        # Webhook serverless para sincronización con Google Sheets
├── CNAME                        # Dominio personalizado oficial (oficiosahome.org)
├── robots.txt                   # Directivas para motores de búsqueda y Googlebot
├── sitemap.xml                  # Mapa del sitio para indexación SEO
├── qrcode.min.js                # Librería local para generación de códigos QR offline
├── server.js                    # Servidor HTTP local ligero en Node.js (desarrollo)
├── icons/                       # Iconografía vectorial y resoluciones PWA (192px, 512px)
└── images/                      # Activos de marca y fotografías reales de oficios
```

---

## 🚀 Cómo Ejecutar en Local

No requiere frameworks pesados ni dependencias complejas:

### Opción 1: Con Node.js (Servidor incluido)
```bash
node server.js
```
Abre en tu navegador: `http://localhost:3000`

### Opción 2: Validar calidad de la base de datos
```bash
node scripts/validate-data.js
```

---

## 📄 Licencia

Este proyecto está bajo la **Licencia Libre MIT**. Siéntete libre de clonarlo, adaptarlo o replicarlo en otros municipios de México para empoderar a la economía local.
