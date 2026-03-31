import { Request, Response } from 'express';
import { prisma } from '../index';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-tu-access-token-aqui' 
});

// Usando fetch nativo de Node.js (disponible en v18+)
export const createPreference = async (req: Request, res: Response) => {
  const { items, localId } = req.body;

  try {
    const local = await prisma.local.findUnique({ where: { id: localId } });

    if (!local) {
      return res.status(404).json({ message: 'Local not found' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN || 'TEST-tu-access-token-aqui';

    const payload = {
        items: items.map((item: any) => ({
          title: item.nombre,
          unit_price: Number(item.precioUnitario),
          quantity: Number(item.cantidad),
          currency_id: 'ARS'
        })),
        back_urls: {
          success: 'http://localhost:5173/success',
          failure: 'http://localhost:5173/failure',
          pending: 'http://localhost:5173/pending'
        },
        external_reference: `local_${localId}`
    };
    
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago API Error:', data);
      return res.status(response.status).json({
        message: 'Error creating payment preference',
        error: data
      });
    }

    res.json({
      preferenceId: data.id,
      initPoint: data.init_point
    });
  } catch (error: any) {
    console.error('Error in createPreference:', error.message);
    res.status(500).json({ 
      message: 'Error in payment controller', 
      error: error.message 
    });
  }
};

export const webhook = async (req: Request, res: Response) => {
  const { type, data } = req.body;

  try {
    if (type === 'payment') {
      const paymentId = data.id;
      const payment = new Payment(client);
      
      const paymentInfo = await payment.get({ id: String(paymentId) });
      
      console.log(`Payment ${paymentId} received, status: ${paymentInfo.status}`);
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error', error: error.message });
  }
};
