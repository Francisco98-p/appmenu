import { Request, Response } from 'express';
import { prisma } from '../index';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-tu-access-token-aqui' 
});

export const createPreference = async (req: Request, res: Response) => {
  const { items, localId } = req.body;

  try {
    const local = await prisma.local.findUnique({ where: { id: localId } });

    if (!local) {
      return res.status(404).json({ message: 'Local not found' });
    }

    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: items.map((item: any) => ({
          title: item.nombre,
          unit_price: Number(item.precioUnitario),
          quantity: Number(item.cantidad),
          currency_id: 'ARS'
        })),
        back_urls: {
          success: 'http://localhost:5173/payment/success',
          failure: 'http://localhost:5173/payment/failure',
          pending: 'http://localhost:5173/payment/pending'
        },
        auto_return: 'approved',
        external_reference: `local_${localId}`,
        notification_url: 'http://localhost:3001/api/payment/webhook'
      }
    });

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point
    });
  } catch (error: any) {
    console.error('Error creating preference:', error);
    res.status(500).json({ message: 'Error creating payment preference', error: error.message });
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
