/* =============================================================================
   My Candy's — Cloudflare Worker (backend sécurisé)
   -----------------------------------------------------------------------------
   Le pont entre le site (GitHub Pages) et les services : Brevo (emails/contacts)
   + Firebase Realtime Database (enregistrements). Aucune clé secrète dans le site :
   tout passe par ce Worker, dont les secrets sont posés dans Cloudflare.

   ROUTES (POST JSON, sauf /health) :
     GET  /health       → test de vie
     POST /newsletter   → { email }                    → Brevo (contact/liste) + Firebase
     POST /contact      → { name, email, message }     → email à la boutique (Brevo) + Firebase
     POST /order        → { items, customer, total }   → commande dans Firebase + email client
                          (⚠️ le paiement SumUp sera branché ICI plus tard)

   VARIABLES à définir dans Cloudflare (Settings → Variables and Secrets) :
     BREVO_API_KEY   (secret)   clé API Brevo
     BREVO_LIST_ID   (var)      id de la liste newsletter Brevo (ex: 2)
     SENDER_EMAIL    (var)      expéditeur VÉRIFIÉ dans Brevo (⚠️ voir note DMARC en bas)
     SENDER_NAME     (var)      ex: My Candy's
     TO_EMAIL        (var)      boîte qui reçoit contacts/commandes (email boutique)
     FIREBASE_DB_URL (var)      https://my-candy-s-default-rtdb.europe-west1.firebasedatabase.app
     ALLOW_ORIGIN    (var, opt) https://linkeeiid.github.io  (sinon: reflète l'origine)
   ============================================================================= */

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}
function isEmail(e) { return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function money(n) { return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €'; }

/* ---- Firebase Realtime Database (REST, authentifié par FIREBASE_SECRET) ---- */
function fbUrl(env, path) {
  const auth = env.FIREBASE_SECRET ? ('?auth=' + encodeURIComponent(env.FIREBASE_SECRET)) : '';
  return env.FIREBASE_DB_URL.replace(/\/+$/, '') + '/' + path + '.json' + auth;
}
async function fbPush(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; } // { name: "<pushId>" }
}
async function fbGet(env, path) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path));
  try { return await r.json(); } catch (e) { return null; }
}

/* ---- Brevo : ajouter/mettre à jour un contact (newsletter) ---- */
async function brevoAddContact(env, email, attributes) {
  return fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      updateEnabled: true,
      listIds: env.BREVO_LIST_ID ? [Number(env.BREVO_LIST_ID)] : undefined,
      attributes: attributes || undefined
    })
  });
}

/* ---- Brevo : envoyer un email transactionnel ---- */
async function brevoSendEmail(env, { toEmail, toName, subject, html, replyTo }) {
  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      sender: { email: env.SENDER_EMAIL, name: env.SENDER_NAME || "My Candy's" },
      to: [{ email: toEmail, name: toName || undefined }],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject,
      htmlContent: html
    })
  });
}

function orderEmailHtml(o) {
  var lines = (o.items || []).map(function (l) {
    return '<tr><td style="padding:4px 0">' + esc(l.name) + ' × ' + (l.qty || 1) + '</td>' +
           '<td style="padding:4px 0;text-align:right">' + money((l.price || 0) * (l.qty || 1)) + '</td></tr>';
  }).join('');
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' +
    '<h2 style="color:#E01784">Merci pour ta commande ! 🍬</h2>' +
    '<p>On prépare tout ça avec soin. Voici le récapitulatif :</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' + lines +
    '<tr><td style="padding-top:8px;border-top:1px solid #eee"><b>Total</b></td>' +
    '<td style="padding-top:8px;border-top:1px solid #eee;text-align:right"><b>' + money(o.total) + '</b></td></tr></table>' +
    '<p style="color:#8A6076;font-size:13px">Tu recevras un email dès l\'expédition de ton colis.</p></div>';
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allow = env.ALLOW_ORIGIN || origin || '*';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(allow) });

    const path = (new URL(request.url)).pathname.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '/health') {
      return json({ ok: true, service: 'my-candys-api' }, 200, allow);
    }

    // --- Console admin : lecture protégée par mot de passe (header Authorization: Bearer <ADMIN_KEY>) ---
    if (path === '/admin/data') {
      const auth = request.headers.get('Authorization') || '';
      if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) {
        return json({ ok: false, error: 'unauthorized' }, 401, allow);
      }
      const parts = await Promise.all([fbGet(env, 'newsletter'), fbGet(env, 'messages'), fbGet(env, 'orders')]);
      return json({ ok: true, newsletter: parts[0], messages: parts[1], orders: parts[2] }, 200, allow);
    }

    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, allow);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    if (body && body.website) return json({ ok: true }, 200, allow); // honeypot anti-bot

    try {
      if (path === '/newsletter') {
        const email = (body.email || '').trim();
        if (!isEmail(email) || email.length > 254) return json({ ok: false, error: 'email_invalide' }, 400, allow);
        await brevoAddContact(env, email, { SOURCE: 'site-newsletter' });
        await fbPush(env, 'newsletter', { email: email, ts: Date.now() });
        return json({ ok: true }, 200, allow);
      }

      if (path === '/contact') {
        const name = (body.name || '').trim().slice(0, 80);
        const email = (body.email || '').trim();
        const message = (body.message || '').trim();
        if (!isEmail(email) || email.length > 254 || !message || message.length > 3000) return json({ ok: false, error: 'champs_invalides' }, 400, allow);
        const html = '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' +
          '<h3 style="color:#E01784">Nouveau message — site My Candy\'s</h3>' +
          '<p><b>De :</b> ' + esc(name) + ' &lt;' + esc(email) + '&gt;</p>' +
          '<p style="white-space:pre-wrap;border-left:3px solid #FF2E9A;padding-left:12px">' + esc(message) + '</p></div>';
        await brevoSendEmail(env, { toEmail: env.TO_EMAIL, subject: 'Contact site — ' + (name || email), html: html, replyTo: email });
        await fbPush(env, 'messages', { name: name, email: email, message: message, ts: Date.now() });
        return json({ ok: true }, 200, allow);
      }

      if (path === '/order') {
        // ⚠️ Fondation commandes. Le paiement SumUp sera vérifié ICI avant validation.
        const order = {
          items: Array.isArray(body.items) ? body.items : [],
          customer: body.customer || {},
          total: body.total || 0,
          status: 'nouvelle',
          paid: false, // deviendra true après confirmation paiement SumUp
          ts: Date.now()
        };
        const res = await fbPush(env, 'orders', order);
        if (isEmail(order.customer.email)) {
          await brevoSendEmail(env, {
            toEmail: order.customer.email, toName: order.customer.name,
            subject: "Ta commande My Candy's 🍬", html: orderEmailHtml(order)
          });
        }
        return json({ ok: true, orderId: res && res.name }, 200, allow);
      }

      return json({ ok: false, error: 'not_found' }, 404, allow);
    } catch (err) {
      return json({ ok: false, error: 'server_error' }, 500, allow);
    }
  }
};

/* -----------------------------------------------------------------------------
   NOTE DMARC (leçon LinkedIA) : envoyer un email "depuis" une adresse @gmail.com
   via Brevo échoue (DMARC → différé/spam). Pour /contact et /order :
   - idéal : SENDER_EMAIL sur un vrai domaine (SPF/DKIM Brevo configurés), ex hello@mycandys.fr
   - sinon : repli Web3Forms (comme LinkedIA) OU garder le mailto.
   La route /newsletter n'envoie AUCUN email au nom du client → aucun souci DMARC,
   c'est pour ça qu'on l'active en premier.
   ----------------------------------------------------------------------------- */
