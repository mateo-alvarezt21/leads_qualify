
const https = require('https');

const url = 'https://evolution-boost-leads-prueba.0fdovo.easypanel.host/api/webhooks?source=web&apiKey=cmlifjive00018jjcujld29ca';

const leads = [
    {
        name: 'Juan Pérez',
        email: 'juan.perez@empresa.com',
        phone: '+573001234567',
        company: 'Tecnología S.A.',
        role: 'Gerente de Compras',
        city: 'Bogotá',
        notes: 'Interesado en una demo del producto premium.'
    },
    {
        name: 'María García',
        email: 'maria.garcia@startu.co',
        phone: '+573109876543',
        company: 'StartUp Innovadora',
        role: 'CEO',
        city: 'Medellín',
        notes: 'Busca soluciones rápidas para escalar.'
    },
    {
        name: 'Carlos López',
        email: 'carlos.lopez@construcciones.net',
        phone: '+573205551122',
        company: 'Construcciones El Sol',
        role: 'Ingeniero Jefe',
        city: 'Cali',
        notes: 'Pregunta por descuentos por volumen.'
    },
    {
        name: 'Ana Martínez',
        email: 'ana.martinez@logisticaglobal.com',
        phone: '+573157778899',
        company: 'Logística Global',
        role: 'Coordinadora',
        city: 'Barranquilla',
        notes: 'Necesita integración con su ERP actual.'
    },
    {
        name: 'Luis Rodríguez',
        email: 'lrodriguez@consultores.org',
        phone: '+573012223344',
        company: 'Consultores Asociados',
        role: 'Socio',
        city: 'Bucaramanga',
        notes: 'Quiere agendar una reunión para la próxima semana.'
    }
];

function sendLead(lead, index) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(lead);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(url, options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`[${index + 1}/5] Éxito: ${lead.name} creado.`);
                    resolve();
                } else {
                    console.error(`[${index + 1}/5] Error: ${res.statusCode} - ${responseBody}`);
                    resolve(); // Resolve to verify next one
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[${index + 1}/5] Error de red: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('Enviando 5 leads de prueba...');
    for (let i = 0; i < leads.length; i++) {
        await sendLead(leads[i], i);
        // Small delay to be nice to rate limiter
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('Proceso finalizado.');
}

run();
