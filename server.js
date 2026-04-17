const express = require('express');
const Stripe = require('stripe');
const app = express();

const stripe = Stripe('sk_test_TU_SECRET_KEY');

app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: 'Compra KickMarket',
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: 'http://localhost:5500/success.html',
    cancel_url: 'http://localhost:5500/cancel.html',
  });

  res.json({ id: session.id });
});

app.listen(3000, () => console.log('Servidor corriendo en 3000'));

async function processPayment() {
  console.log("CLICK DETECTADO");}