# WhatsApp Cloud API — Guía de Implementación

> Referencia interna para la integración de Meta WhatsApp Cloud API en LeadQuality.
> Basada en la documentación oficial de Meta (Graph API v21.0).

---

## ¿Qué es WhatsApp Cloud API?

Es la API **oficial de Meta** para enviar y recibir mensajes de WhatsApp. A diferencia de Baileys (que hace ingeniería inversa del protocolo web), Cloud API es una integración directa con los servidores de Meta vía HTTP REST + Webhooks.

**Ventajas sobre Baileys:**
- Sin riesgo de ban (es el canal oficial)
- Sin conexión persistente — completamente stateless
- 99.9% SLA de Meta
- Sin gestión de sesiones ni QR codes

**Desventajas:**
- Requiere número verificado en Meta Business Manager
- Mensajes libres solo en ventana de 24h (después requiere templates)
- Costo por conversación (según plan de Meta)

---

## Credenciales necesarias

Estas son las credenciales que se obtienen desde el **Meta Developer Portal** y el **Meta Business Manager**. No se necesita ser Tech Provider (BSP).

### 1. Phone Number ID
- **Qué es:** ID interno de Meta para tu número de WhatsApp. NO es el número de teléfono real.
- **Dónde conseguirlo:** Meta App Dashboard → WhatsApp → API Setup → sección "From"
- **Ejemplo:** `104512345678901`
- **Para qué se usa:** Va directo en la URL de envío de mensajes.

### 2. Access Token (System User Token)
- **Qué es:** Token OAuth permanente para autenticar todas las llamadas a la API.
- **Tipos:**
  - *Temporal (~24h):* aparece en App Dashboard → WhatsApp → API Setup. Solo para pruebas.
  - *Permanente (System User Token):* para producción — NO expira salvo que lo revoques manualmente.
- **Cómo generar el token permanente:**
  1. Meta Business Manager → Configuración → Usuarios del sistema
  2. Crear usuario de sistema (rol: Admin)
  3. Asignar permisos: `whatsapp_business_messaging` + `whatsapp_business_management`
  4. Generar token → seleccionar tu app
- **Para qué se usa:** Header `Authorization: Bearer {ACCESS_TOKEN}` en cada request.

### 3. WABA ID (WhatsApp Business Account ID)
- **Qué es:** ID de tu cuenta de WhatsApp Business — el contenedor que agrupa tus números, templates y configuraciones.
- **Dónde conseguirlo:** Meta Business Manager → Configuración → Cuentas → WhatsApp Business → ID visible en el panel lateral.
- **Ejemplo:** `102987654321`
- **Para qué se usa:** Gestión de números, templates y suscripción de webhooks.

### 4. App Secret
- **Qué es:** Clave secreta de tu Meta App.
- **Dónde conseguirlo:** App Dashboard → Configuración → Básico → App Secret
- **Para qué se usa:** Validar la firma `X-Hub-Signature-256` que Meta incluye en cada webhook entrante (seguridad).

### 5. Verify Token
- **Qué es:** Un string **que defines tú** — puede ser cualquier texto secreto.
- **Para qué se usa:** Durante la verificación del webhook, Meta te envía este token de vuelta para confirmar que el endpoint es tuyo.
- **Dónde se configura:** Lo pones en tu servidor Y en el campo "Verify Token" al registrar el webhook en App Dashboard → WhatsApp → Configuración → Webhooks.

### 6. API Version
- **Valor actual:** `v21.0`
- **Para qué se usa:** Parte de todas las URLs de la Graph API.
- **Nota:** Se puede hardcodear en el código — actualizar cuando Meta lance versiones nuevas.

---

## Resumen de campos en el formulario de LeadQuality

| Campo en UI | Descripción | Obligatorio |
|---|---|---|
| Nombre / Etiqueta | "Ventas", "Soporte", etc. | Sí |
| Phone Number ID | ID del número en Meta | Sí |
| Access Token | System User Token permanente | Sí |
| WABA ID | ID de la cuenta de negocio | Sí |
| App Secret | Clave de la app de Meta | Sí |
| Verify Token | String secreto definido por el usuario | Sí |

---

## Envío de mensajes

### Endpoint
```
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {ACCESS_TOKEN}
```

### Body (mensaje de texto)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "573001234567",
  "type": "text",
  "text": {
    "body": "Hola, gracias por contactarnos."
  }
}
```

> **Importante:** El campo `to` debe estar en formato E.164 **sin el signo `+`**
> Ejemplo: `+57 300 123 4567` → `573001234567`

### Respuesta exitosa
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "573001234567", "wa_id": "573001234567" }],
  "messages": [{ "id": "wamid.HBgN..." }]
}
```

---

## Configuración del Webhook

### Paso 1 — Registrar el endpoint en Meta

1. App Dashboard → WhatsApp → Configuración → Webhooks
2. **Callback URL:** `https://tu-dominio.com/api/whatsapp-cloud/webhook`
3. **Verify Token:** el string que definiste
4. Click "Verificar y guardar"
5. Después de verificar, click "Administrar" y suscribirse al campo **`messages`**

### Paso 2 — Verificación del webhook (GET)

Cuando registras el webhook, Meta hace un GET a tu endpoint:

```
GET /api/whatsapp-cloud/webhook
  ?hub.mode=subscribe
  &hub.verify_token=TU_VERIFY_TOKEN
  &hub.challenge=1158201444
```

Tu servidor debe:
1. Verificar que `hub.mode === "subscribe"`
2. Verificar que `hub.verify_token` coincide con el tuyo almacenado
3. Responder `200 OK` con el valor de `hub.challenge` como body
4. Si no coincide → responder `403`

```typescript
// GET /api/whatsapp-cloud/webhook
if (mode === 'subscribe' && token === account.verifyToken) {
  return new Response(challenge, { status: 200 });
}
return new Response('Forbidden', { status: 403 });
```

---

## Payload de mensaje entrante (POST)

Cuando un usuario te escribe, Meta hace un POST a tu webhook con este formato:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "573001234567",
          "phone_number_id": "104512345678901"
        },
        "contacts": [{
          "profile": { "name": "Juan Pérez" },
          "wa_id": "573009876543"
        }],
        "messages": [{
          "from": "573009876543",
          "id": "wamid.HBgN...",
          "timestamp": "1710000000",
          "type": "text",
          "text": { "body": "Hola, quiero información" }
        }]
      }
    }]
  }]
}
```

### Mapa de campos importantes

| Dato | Ruta en el JSON |
|---|---|
| Teléfono del remitente | `entry[0].changes[0].value.messages[0].from` |
| Nombre del remitente | `entry[0].changes[0].value.contacts[0].profile.name` |
| Texto del mensaje | `entry[0].changes[0].value.messages[0].text.body` |
| Tipo de mensaje | `entry[0].changes[0].value.messages[0].type` |
| Phone Number ID (tu número) | `entry[0].changes[0].value.metadata.phone_number_id` |
| Timestamp (Unix) | `entry[0].changes[0].value.messages[0].timestamp` |

> El `phone_number_id` en `metadata` es la clave para identificar cuál de tus cuentas Cloud recibió el mensaje y rutear correctamente al `WhatsAppCloudAccount` correspondiente.

### Tipos de mensaje a manejar

| `type` | Descripción | ¿Lo procesamos? |
|---|---|---|
| `text` | Mensaje de texto plano | Sí |
| `image` | Imagen | No (ignorar) |
| `audio` | Audio/nota de voz | No (ignorar) |
| `video` | Video | No (ignorar) |
| `document` | Documento/PDF | No (ignorar) |
| `sticker` | Sticker | No (ignorar) |
| `location` | Ubicación | No (ignorar) |
| `button` | Respuesta a botón de template | Opcional futuro |

---

## Seguridad — Validación de firma

Cada POST de Meta incluye el header:
```
X-Hub-Signature-256: sha256=abc123...
```

Es un HMAC-SHA256 del body del request usando el **App Secret** como clave. Se debe validar antes de procesar:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  appSecret: string
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
```

> **Siempre responder `200 OK` en menos de 20 segundos**, aunque no se procese el mensaje. Si Meta no recibe respuesta, reintenta y puede deshabilitar el webhook.

---

## Diferencias clave vs la implementación Baileys actual

| Aspecto | Baileys (lib/whatsapp.ts) | Cloud API (lib/whatsapp-cloud.ts) |
|---|---|---|
| Tipo de conexión | WebSocket persistente | Stateless — solo HTTP |
| Estado en memoria | `globalThis` Maps | Ninguno |
| Watchdog / reconexión | Necesario | No aplica |
| QR Code | Sí | No |
| Credenciales guardadas | `WhatsAppSession` (muchas filas) | `WhatsAppCloudAccount` (una fila) |
| Modelo Prisma | `WhatsAppInstance` + `WhatsAppSession` | `WhatsAppCloudAccount` |
| Envío de mensajes | `sock.sendMessage(jid, { text })` | `fetch` a Graph API |
| Identificar instancia | `instanceId` en Maps globales | `phone_number_id` en webhook payload |
| Lógica de buffer | En memoria (timer + Map) | En memoria (mismo sistema) |
| Welcome message | `sendWelcomeMessage()` | `sendCloudMessage()` |
| Qualify lead | `qualifyLead()` — idéntico | `qualifyLead()` — idéntico |

---

## Plan de implementación en LeadQuality

### 1. Schema Prisma
- Nuevo modelo `WhatsAppCloudAccount`
- Nuevo campo `whatsappCloudAccountId` en `Lead`

### 2. `lib/whatsapp-cloud.ts`
- `sendCloudMessage()` — POST a Graph API
- `processCloudWebhook()` — parsear payload + lógica buffer (reutiliza el sistema existente)
- `sendWelcomeCloudMessage()` — welcome message
- `verifyWebhookSignature()` — seguridad

### 3. Rutas API
- `GET /api/whatsapp-cloud/webhook` — verificación Meta
- `POST /api/whatsapp-cloud/webhook` — mensajes entrantes
- `GET /api/whatsapp-cloud` — listar cuentas del org
- `POST /api/whatsapp-cloud` — crear / eliminar cuentas

### 4. UI
- `components/WhatsAppCloudSettings.tsx` — formulario de credenciales + lista de cuentas

### 5. Settings Page
- Nueva sección "WhatsApp Cloud API" en `app/settings/page.tsx`

### 6. db-diagram.html
- Actualizar con el nuevo modelo y sus relaciones

---

## URLs de referencia oficial

- Get Started: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Send Messages: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
- Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
- Messages Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
- Phone Numbers: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers
