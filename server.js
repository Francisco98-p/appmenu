const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Importar datos desde data.js
const data = require('./data.js');
let { supermarkets, categories, offers, changuitos } = data;

// Rutas API
app.get('/api/supermarkets', (req, res) => {
    res.json(supermarkets);
});

app.get('/api/categories', (req, res) => {
    res.json(categories);
});

app.get('/api/offers', (req, res) => {
    const { supermarketId, categoryId, sort, search } = req.query;
    let result = [...offers];

    if (supermarketId) {
        result = result.filter(o => o.supermarketId === parseInt(supermarketId));
    }

    if (categoryId) {
        result = result.filter(o => o.categoryId === parseInt(categoryId));
    }

    if (search) {
        const query = search.toLowerCase();
        result = result.filter(o => 
            o.product.toLowerCase().includes(query) ||
            supermarkets.find(s => s.id === o.supermarketId).name.toLowerCase().includes(query)
        );
    }

    if (sort) {
        switch (sort) {
            case 'discount':
                result.sort((a, b) => ((b.oldPrice - b.newPrice) / b.oldPrice) - ((a.oldPrice - a.newPrice) / a.oldPrice));
                break;
            case 'price-low':
                result.sort((a, b) => a.newPrice - b.newPrice);
                break;
            case 'price-high':
                result.sort((a, b) => b.newPrice - a.newPrice);
                break;
            case 'name':
                result.sort((a, b) => a.product.localeCompare(b.product));
                break;
        }
    }

    res.json(result);
});

app.get('/api/changuitos', (req, res) => {
    res.json(changuitos);
});

app.get('/api/stats', (req, res) => {
    const totalOffers = offers.length;
    const totalSupermarkets = supermarkets.length;
    const totalDiscount = offers.reduce((acc, o) => acc + Math.round(((o.oldPrice - o.newPrice) / o.oldPrice) * 100), 0);
    const avgDiscount = Math.round(totalDiscount / totalOffers);

    res.json({ totalSupermarkets, totalOffers, avgDiscount });
});

app.post('/api/orders', (req, res) => {
    const { productId, changuitoId, address, phone, paymentMethod } = req.body;
    
    if (changuitoId) {
        const chan = changuitos.find(c => c.id === parseInt(changuitoId));
        console.log(`📦 Nuevo pedido de CHANGUITO recibido:
        Changuito: ${chan ? chan.name : 'Desconocido'} (ID: ${changuitoId})
        Dirección: ${address}
        Teléfono: ${phone}
        Método de Pago: ${paymentMethod}`);
    } else {
        console.log(`📦 Nuevo pedido de PRODUCTO recibido:
        Producto ID: ${productId}
        Dirección: ${address}
        Teléfono: ${phone}
        Método de Pago: ${paymentMethod}`);
    }
    
    res.json({ success: true, message: "Pedido enviado con éxito", orderId: Math.floor(Math.random() * 1000000) });
});

// Servir archivos estáticos (el frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🛒 OfertasCiudad corriendo en: http://localhost:${PORT}\n`);
});
