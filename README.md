# 👟 KickMarket — PWA de Tenis Exclusivos

Mercado de compra/venta de tenis tipo StockX, construido como PWA (Progressive Web App) con integración de Stripe para pagos.

---

## 🚀 Estructura del proyecto

```
kickmarket-pwa/
├── index.html          ← App completa (UI + lógica)
├── manifest.json       ← Configuración PWA
├── sw.js               ← Service Worker (offline + caché)
├── README.md           ← Este archivo
└── icons/              ← (Crear) Íconos de la app
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## 📦 Cómo desplegar

### Opción 1 — Servidor local (desarrollo)

```bash
# Con Python
python3 -m http.server 3000

# Con Node.js
npx serve .

# Con VS Code
# Instala la extensión "Live Server" y haz clic en "Go Live"
```

Luego abre: `http://localhost:3000`

> ⚠️ El Service Worker **requiere** HTTPS o `localhost` para funcionar.

### Opción 2 — Despliegue gratuito con Netlify

1. Crea cuenta en [netlify.com](https://netlify.com)
2. Arrastra la carpeta `kickmarket-pwa/` al dashboard
3. ¡Listo! Obtienes HTTPS automático

### Opción 3 — GitHub Pages

```bash
git init
git add .
git commit -m "KickMarket PWA"
git branch -M main
git remote add origin https://github.com/tu-usuario/kickmarket.git
git push -u origin main
```

Luego activa GitHub Pages en Settings → Pages → Branch: main.

---

## 💳 Integración real de Stripe

La versión actual incluye un **formulario de pago simulado**. Para pagos reales:

### 1. Instala Stripe.js

Agrega en `<head>` de `index.html`:

```html
<script src="https://js.stripe.com/v3/"></script>
```

### 2. Crea Payment Intent (backend requerido)

Necesitas un backend (Node.js, Python, etc.) para crear el Payment Intent de forma segura:

```javascript
// backend/server.js (Node.js + Express)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe usa centavos
    currency: currency || 'mxn',
    payment_method_types: ['card', 'oxxo'],
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

### 3. Integra el formulario en el frontend

Reemplaza la función `processPayment()` en `index.html`:

```javascript
const stripe = Stripe('pk_live_TU_LLAVE_PUBLICA');
const elements = stripe.elements();
const cardElement = elements.create('card', {
  style: {
    base: {
      color: '#f5f5f0',
      fontFamily: '"DM Sans", sans-serif',
      backgroundColor: 'transparent',
    }
  }
});
cardElement.mount('#card-element');

async function processPayment() {
  const total = cart.reduce((s,i)=>s+i.price, 0) + 299;
  
  // 1. Crear Payment Intent en tu backend
  const { clientSecret } = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: total, currency: 'mxn' })
  }).then(r => r.json());

  // 2. Confirmar el pago con Stripe
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: document.getElementById('cardName').value,
        email: document.getElementById('cardEmail').value,
      }
    }
  });

  if (error) {
    showToast('❌ ' + error.message);
  } else if (paymentIntent.status === 'succeeded') {
    closeCheckout();
    showSuccessModal(paymentIntent.id);
  }
}
```

### 4. Variables de entorno

```bash
# .env (NUNCA subir a git)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Webhooks (para confirmar órdenes)

```javascript
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Actualizar estado de la orden en tu base de datos
    fulfillOrder(paymentIntent);
  }
  res.json({ received: true });
});
```

---

## 🔐 Métodos de pago soportados (México)

| Método | Configuración |
|--------|--------------|
| Tarjeta Visa/MC/Amex | Habilitado por defecto |
| OXXO | `payment_method_types: ['oxxo']` |
| SPEI (transferencia) | `payment_method_types: ['customer_balance']` |
| Apple Pay / Google Pay | `payment_method_types: ['link', 'card']` |

---

## 📱 Características PWA

- ✅ **Offline first** — Service Worker con estrategia Cache First
- ✅ **Instalable** — manifest.json con todos los tamaños de íconos
- ✅ **Responsive** — Funciona en móvil, tablet y desktop
- ✅ **Background Sync** — Reintentar órdenes fallidas cuando hay conexión
- ✅ **Push Notifications** — Alertas de precio y nuevos drops
- ✅ **Shortcuts** — Accesos directos desde el ícono de la app

---

## 🎨 Tecnologías usadas

- **HTML/CSS/JS** puro — Sin frameworks, carga instantánea
- **Bebas Neue** — Tipografía display
- **DM Sans** — Tipografía cuerpo
- **Stripe.js** — Procesamiento de pagos (simulado en esta versión)
- **Service Worker API** — Funcionalidad offline
- **Web App Manifest** — Instalación como app nativa

---

## 📊 Funcionalidades

- [x] Catálogo con filtros por marca
- [x] Modal de producto con selector de tallas
- [x] Tabla de trending con variación de precios
- [x] Ticker de precios en tiempo real (simulado)
- [x] Carrito de compras con drawer lateral
- [x] Formulario de checkout con Stripe
- [x] Pantalla de confirmación de orden
- [x] Favoritos (wishlist)
- [x] Banner de instalación PWA
- [ ] Autenticación de usuarios
- [ ] Base de datos de productos
- [ ] Sistema de pujas en tiempo real
- [ ] Panel de vendedor
- [ ] Tracking de envíos

---

## 📄 Licencia

MIT — Libre para uso comercial y personal.
