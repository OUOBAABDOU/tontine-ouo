import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

let myFilename = '';
let myDirname = '';

try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    myFilename = fileURLToPath(import.meta.url);
    myDirname = path.dirname(myFilename);
  } else {
    myFilename = __filename;
    myDirname = __dirname;
  }
} catch (e) {
  myFilename = '';
  myDirname = process.cwd();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse json and urlencoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // REAL TWILIO SMS INTEGRATION ROUTE
  // ==========================================
  app.post('/api/sms/send', async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone et message requis.' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    console.log(`[SMS Queue] Tentative d'envoi à ${phoneNumber}...`);

    if (!accountSid || !authToken || !twilioPhone) {
      console.warn('⚠️ Twilio n\'est pas configuré. Simulation de l\'envoi SMS réussie.');
      return res.json({
        success: true,
        simulated: true,
        info: 'Twilio non configuré dans les variables d\'environnement. Mode simulation actif.',
        smsDetails: {
          to: phoneNumber,
          body: message,
          from: 'ASSI_SMS_SIM'
        }
      });
    }

    try {
      // Direct raw fetch request to avoid external package loading issues
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioPhone,
          Body: message,
        }),
      });

      const data = await response.json() as any;

      if (response.ok) {
        console.log(`[SMS Success] Envoyé à ${phoneNumber} (SID: ${data.sid})`);
        return res.json({ success: true, simulated: false, sid: data.sid });
      } else {
        console.error(`[SMS Error] Échec de l'envoi Twilio:`, data);
        return res.status(response.status).json({ 
          success: false, 
          error: data.message || 'Erreur Twilio inconnue',
          details: data 
        });
      }
    } catch (err: any) {
      console.error(`[SMS Exception]`, err);
      return res.status(500).json({ success: false, error: err.message || 'Exception interne' });
    }
  });

  // ==========================================
  // REAL FEDAPAY MOBILE MONEY INTEGRATION ROUTE
  // ==========================================
  app.post('/api/payment/create-transaction', async (req, res) => {
    const { amount, phoneNumber, operator, customerName } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Montant valide requis.' });
    }

    const fedapayKey = process.env.FEDAPAY_API_KEY;
    const isSandbox = !fedapayKey || fedapayKey.includes('sandbox') || fedapayKey.includes('test');
    const endpoint = isSandbox 
      ? 'https://sandbox-api.fedapay.com/v1/transactions' 
      : 'https://api.fedapay.com/v1/transactions';

    console.log(`[Mobile Money] Initialisation du paiement de ${amount} FCFA par ${operator}...`);

    if (!fedapayKey) {
      console.warn('⚠️ FEDAPAY_API_KEY non configuré. Mode simulation actif.');
      // Return a simulated pay url so the UI behaves exactly as real
      const simulatedTxId = `tx_sim_${Date.now()}`;
      return res.json({
        success: true,
        simulated: true,
        info: 'FedaPay non configuré. Mode simulation de paiement actif.',
        transaction: {
          id: simulatedTxId,
          amount: Number(amount),
          status: 'pending',
          payment_url: `/api/payment/simulated-checkout?id=${simulatedTxId}&amount=${amount}&phone=${encodeURIComponent(phoneNumber || '')}&operator=${encodeURIComponent(operator || '')}`
        }
      });
    }

    try {
      // Build FedaPay payload
      // FedaPay expects amount, currency "XOF", customer firstname/lastname/email/phone_number
      const names = (customerName || 'Maman Marie').split(' ');
      const firstname = names[0] || 'Maman';
      const lastname = names.slice(1).join(' ') || 'Utilisatrice';

      const appUrl = process.env.APP_URL || `http://localhost:3000`;
      const callbackUrl = `${appUrl}/api/payment/callback`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fedapayKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: `Recharge Portefeuille ASSI Wallet - ${operator}`,
          amount: Number(amount),
          currency: {
            iso: 'XOF'
          },
          callback_url: callbackUrl,
          customer: {
            firstname,
            lastname,
            email: `${firstname.toLowerCase()}@assi-maman.com`,
            phone_number: {
              number: phoneNumber || '70000000',
              country: 'BF' // Burkina Faso by default
            }
          }
        })
      });

      const rawData = await response.json() as any;

      if (response.ok) {
        // FedaPay returns the transaction wrapped under key "v1/transaction" or directly
        const tx = rawData['v1/transaction'] || rawData.transaction || rawData;
        console.log(`[Mobile Money Success] Transaction FedaPay créée: ${tx.id}. Checkout URL: ${tx.payment_url}`);
        return res.json({
          success: true,
          simulated: false,
          transaction: {
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            payment_url: tx.payment_url
          }
        });
      } else {
        console.error(`[Mobile Money Error] Échec API FedaPay:`, rawData);
        return res.status(response.status).json({
          success: false,
          error: rawData.message || 'Erreur d\'initialisation du paiement FedaPay.',
          details: rawData
        });
      }
    } catch (err: any) {
      console.error(`[Mobile Money Exception]`, err);
      return res.status(500).json({ success: false, error: err.message || 'Exception interne' });
    }
  });

  // Simple simulated checkout UI endpoint for offline testing
  app.get('/api/payment/simulated-checkout', (req, res) => {
    const { id, amount, phone, operator } = req.query;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Passerelle de Paiement FedaPay (Simulation)</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 flex items-center justify-center min-h-screen p-4 font-sans">
        <div class="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl text-center space-y-6">
          <div class="flex justify-center items-center gap-2">
            <span class="text-3xl">🛡️</span>
            <h1 class="text-xl font-black text-[#0175C2]">FedaPay Sandbox</h1>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl text-left space-y-2.5">
            <div class="flex justify-between text-xs text-slate-500">
              <span>Bénéficiaire :</span>
              <span class="font-extrabold text-slate-800">ASSI TONTINE</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>Opérateur sélectionné :</span>
              <span class="font-bold text-slate-800">${operator} Money</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>Téléphone Maman :</span>
              <span class="font-mono font-bold text-slate-800">${phone}</span>
            </div>
            <div class="border-t border-slate-150 my-2 pt-2 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Montant total :</span>
              <span class="text-lg font-extrabold text-emerald-600">${Number(amount).toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
          
          <div class="space-y-2">
            <button onclick="paySuccess()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all">
              Simuler Paiement Réussi ✅
            </button>
            <button onclick="payCancel()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">
              Annuler la transaction ✕
            </button>
          </div>
        </div>
        <script>
          function paySuccess() {
            alert("Simulation de paiement réussie ! Retour vers l'application...");
            window.location.href = "/?payment_status=success&amount=${amount}&tx_id=${id}";
          }
          function payCancel() {
            window.location.href = "/?payment_status=cancelled";
          }
        </script>
      </body>
      </html>
    `);
  });

  // Real or simulated webhook callback endpoint for payment aggregator
  app.all('/api/payment/callback', (req, res) => {
    console.log('[Mobile Money Webhook] Callback reçu:', req.body);
    // In production, we'd process webhooks to update user balance asynchronously.
    res.json({ received: true });
  });

  // ==========================================
  // VITE DEV SERVER & PRODUCTION ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
