/* =============================================================================
   My Candy's — Cloudflare Worker (backend sécurisé)
   -----------------------------------------------------------------------------
   Le pont entre le site (GitHub Pages) et les services : Brevo (emails/contacts)
   + Firebase Realtime Database (enregistrements) + SumUp (paiement en ligne).
   Aucune clé secrète dans le site : tout passe par ce Worker (secrets dans Cloudflare).

   ROUTES :
     GET  /health           → test de vie
     GET  /catalog          → surcharges catalogue (public)
     POST /catalog          → écrit une surcharge (admin, Bearer ADMIN_KEY)
     GET  /admin/data       → dump newsletter/messages/orders (admin)
     POST /newsletter       → { email }
     POST /contact          → { name, email, message }
     POST /order            → (LEGACY) commande sans paiement — remplacé par le flux SumUp
     POST /create-checkout  → { items:[{id,qty,name}], shipping, customer }
                              → recalcule le montant CÔTÉ SERVEUR, crée le checkout SumUp,
                                enregistre la commande "en_attente_paiement" dans Firebase
                              → renvoie { checkoutId, reference, amount }
     POST /confirm          → { checkoutId, reference } → vérifie PAID chez SumUp,
                                marque la commande payée + email client (idempotent)
     POST /sumup-webhook    → callback SumUp (return_url) → même finalisation (filet)

   VARIABLES (Cloudflare → Settings → Variables and Secrets) :
     BREVO_API_KEY (secret) · BREVO_LIST_ID · SENDER_EMAIL · SENDER_NAME · TO_EMAIL
     FIREBASE_DB_URL · FIREBASE_SECRET (secret) · ADMIN_KEY (secret) · ALLOW_ORIGIN (opt)
     >>> À AJOUTER pour le paiement :
     SUMUP_SECRET_KEY    (secret)  ta clé API SumUp (sup_sk_…)
     SUMUP_MERCHANT_CODE (var)     code marchand SumUp (ex: M6HM189G)
   ============================================================================= */

/* Prix de BASE (source de vérité serveur, tiré de products.js). Le prix facturé =
   override Firebase /catalog/{id}.price s'il existe, sinon ce prix de base.
   ⚠️ Garder synchro si tu changes un prix dans products.js. */
const BASE_PRICES = {
  'prime-blue': 3.49, 'prime-ice': 3.49, 'prime-lemon': 3.49, 'prime-moon': 3.49, 'prime-straw': 3.49,
  'takis-fuego': 4.90, 'takis-blue': 4.90, 'takis-nitro': 4.90, 'takis-guaca': 5.20,
  'monster-ultra': 2.49, 'monster-mango': 2.49, 'monster-pipe': 2.49, 'monster-zero': 2.49,
  'fanta-grape': 2.90, 'fanta-pine': 2.90, 'fanta-berry': 2.90, 'fanta-peach': 3.20,
  'kinder-bueno': 2.20, 'kinder-schoko': 5.90, 'kinder-joy': 3.20, 'kinder-cards': 2.50,
  'sourpatch': 3.90, 'oreo-bday': 4.50, 'samyang': 2.29, 'chamoy': 12.90, 'hershey': 3.20,
  'nerds': 4.20, 'poptarts': 5.50, 'mochi': 5.90, 'calypso': 3.40,
  'box-s': 14.90, 'box-m': 24.90, 'box-xxl': 49.90
};
/* Frais de port (identiques à checkout.html) : coût de base + seuil de gratuité. */
const SHIP = { relais: { cost: 4.90, free: 39 }, domicile: { cost: 6.90, free: 59 } };
function shipCost(mode, sub) { const m = SHIP[mode] || SHIP.relais; return sub >= m.free ? 0 : m.cost; }
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

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
function str(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 120); }
function rand6() { return String(Math.floor(100000 + Math.random() * 900000)); }

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
async function fbSet(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; }
}
async function fbPatch(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; }
}
async function fbGet(env, path) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path));
  try { return await r.json(); } catch (e) { return null; }
}

/* ---- SumUp Online Payments ---- */
async function sumupCreateCheckout(env, { reference, amount, description, returnUrl }) {
  const r = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.SUMUP_SECRET_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkout_reference: reference,
      amount: amount,
      currency: 'EUR',
      merchant_code: env.SUMUP_MERCHANT_CODE,
      description: description || undefined,
      return_url: returnUrl || undefined
    })
  });
  try { return await r.json(); } catch (e) { return null; }
}
async function sumupGetCheckout(env, id) {
  const r = await fetch('https://api.sumup.com/v0.1/checkouts/' + encodeURIComponent(id), {
    headers: { 'Authorization': 'Bearer ' + env.SUMUP_SECRET_KEY }
  });
  try { return await r.json(); } catch (e) { return null; }
}

/* ---- Brevo : contact (newsletter) ---- */
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
/* ---- Brevo : email transactionnel ---- */
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
  var ship = o.shippingCost ? money(o.shippingCost) : 'Offerte';
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' +
    '<h2 style="color:#E01784">Merci pour ta commande ! 🍬</h2>' +
    '<p>Paiement bien reçu. On prépare ton colis avec soin.</p>' +
    '<p style="font-size:13px;color:#8A6076">Commande <b>' + esc(o.reference || '') + '</b></p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' + lines +
    '<tr><td style="padding-top:8px">Livraison</td><td style="padding-top:8px;text-align:right">' + ship + '</td></tr>' +
    '<tr><td style="padding-top:8px;border-top:1px solid #eee"><b>Total payé</b></td>' +
    '<td style="padding-top:8px;border-top:1px solid #eee;text-align:right"><b>' + money(o.total) + '</b></td></tr></table>' +
    '<p style="color:#8A6076;font-size:13px">Comme certains produits sont réapprovisionnés à la commande, ' +
    'compte quelques jours de préparation. Tu recevras un email dès l\'expédition. 💌</p></div>';
}

/* Finalise une commande si le paiement SumUp est bien PAID. Idempotent. */
async function finalizeIfPaid(env, reference, checkoutId) {
  // Petit retry : juste après le widget, le statut peut mettre 1 instant à passer PAID.
  let co = null;
  for (let i = 0; i < 3; i++) {
    co = await sumupGetCheckout(env, checkoutId);
    if (co && co.status && co.status !== 'PENDING') break;
    await new Promise(function (r) { setTimeout(r, 700); });
  }
  if (!co || co.status !== 'PAID') return { ok: false, status: (co && co.status) || 'unknown' };

  const order = await fbGet(env, 'orders/' + reference);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.paid) return { ok: true, already: true, reference: reference, total: order.total };

  const tx = (co.transactions && co.transactions[0]) || {};
  await fbPatch(env, 'orders/' + reference, {
    paid: true, status: 'nouvelle',
    transaction_code: tx.transaction_code || null,
    transaction_id: tx.id || null,
    paidTs: Date.now()
  });
  order.paid = true;
  if (isEmail(order.customer && order.customer.email)) {
    await brevoSendEmail(env, {
      toEmail: order.customer.email, toName: order.customer.name,
      subject: "Ta commande My Candy's 🍬 — " + reference, html: orderEmailHtml(order)
    });
  }
  return { ok: true, reference: reference, total: order.total };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allow = env.ALLOW_ORIGIN || origin || '*';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(allow) });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '/health') {
      return json({ ok: true, service: 'my-candys-api' }, 200, allow);
    }

    // --- Console admin : lecture protégée (Authorization: Bearer <ADMIN_KEY>) ---
    if (path === '/admin/data') {
      const auth = request.headers.get('Authorization') || '';
      if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) {
        return json({ ok: false, error: 'unauthorized' }, 401, allow);
      }
      const parts = await Promise.all([fbGet(env, 'newsletter'), fbGet(env, 'messages'), fbGet(env, 'orders')]);
      return json({ ok: true, newsletter: parts[0], messages: parts[1], orders: parts[2] }, 200, allow);
    }

    // --- Catalogue : lecture publique des surcharges ---
    if (path === '/catalog' && request.method === 'GET') {
      const cat = await fbGet(env, 'catalog');
      return json({ ok: true, overrides: cat || {} }, 200, allow);
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

      // ------------------------- PAIEMENT SUMUP -------------------------

      if (path === '/create-checkout') {
        const items = Array.isArray(body.items) ? body.items : [];
        const shipping = (body.shipping === 'domicile') ? 'domicile' : 'relais';
        const c = body.customer || {};
        if (!items.length) return json({ ok: false, error: 'panier_vide' }, 400, allow);
        if (!isEmail(c.email)) return json({ ok: false, error: 'email_invalide' }, 400, allow);
        if (!env.SUMUP_SECRET_KEY || !env.SUMUP_MERCHANT_CODE) return json({ ok: false, error: 'sumup_non_configure' }, 500, allow);

        // Prix qui font autorité = base products.js + overrides Firebase.
        const ov = (await fbGet(env, 'catalog')) || {};
        let sub = 0; const lines = [];
        for (const it of items) {
          const id = str(it.id, 60);
          const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
          const base = BASE_PRICES[id];
          if (base == null) return json({ ok: false, error: 'produit_inconnu', id: id }, 400, allow);
          const o = ov[id] || {};
          if (o.deleted || o.available === false) return json({ ok: false, error: 'produit_indisponible', id: id }, 400, allow);
          const price = (o.price != null && !isNaN(o.price)) ? Number(o.price) : base;
          sub += price * qty;
          lines.push({ id: id, name: str(it.name, 80) || id, price: round2(price), qty: qty });
        }
        sub = round2(sub);
        const ship = shipCost(shipping, sub);
        const total = round2(sub + ship);
        if (total <= 0) return json({ ok: false, error: 'montant_invalide' }, 400, allow);

        const reference = 'MC-' + new Date().getUTCFullYear() + '-' + rand6();
        const customer = {
          email: str(c.email, 254), name: (str(c.first, 60) + ' ' + str(c.last, 60)).trim(),
          first: str(c.first, 60), last: str(c.last, 60), tel: str(c.tel, 30),
          addr: str(c.addr, 160), addr2: str(c.addr2, 160), zip: str(c.zip, 16),
          city: str(c.city, 80), country: str(c.country, 60)
        };
        const order = {
          reference: reference, items: lines, customer: customer, shipping: shipping,
          subtotal: sub, shippingCost: ship, total: total,
          status: 'en_attente_paiement', paid: false, ts: Date.now()
        };
        await fbSet(env, 'orders/' + reference, order);

        const co = await sumupCreateCheckout(env, {
          reference: reference, amount: total, description: "My Candy's " + reference,
          returnUrl: url.origin + '/sumup-webhook'
        });
        if (!co || !co.id) {
          return json({ ok: false, error: 'sumup_checkout_failed', detail: co && (co.message || co.error_code || co.error_message) }, 502, allow);
        }
        return json({ ok: true, checkoutId: co.id, reference: reference, amount: total }, 200, allow);
      }

      if (path === '/confirm') {
        const reference = str(body.reference, 90);
        const checkoutId = str(body.checkoutId, 80);
        if (!reference || !checkoutId) return json({ ok: false, error: 'params_manquants' }, 400, allow);
        const res = await finalizeIfPaid(env, reference, checkoutId);
        return json(res, res.ok ? 200 : 402, allow);
      }

      if (path === '/sumup-webhook') {
        // SumUp appelle return_url avec l'id (ou la ref) du checkout. On revérifie et on finalise.
        let id = str(body.id || body.checkout_id || (body.payload && body.payload.id), 80);
        if (!id) id = str(url.searchParams.get('id'), 80);
        if (id) {
          const co = await sumupGetCheckout(env, id);
          if (co && co.checkout_reference) await finalizeIfPaid(env, co.checkout_reference, id);
        }
        return json({ ok: true }, 200, allow);
      }

      if (path === '/order') {
        // LEGACY : commande sans paiement (conservée pour compat ; le flux SumUp la remplace).
        const order = {
          items: Array.isArray(body.items) ? body.items : [],
          customer: body.customer || {},
          total: body.total || 0,
          status: 'nouvelle', paid: false, ts: Date.now()
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

      if (path === '/catalog') {
        // écriture protégée : surcharge produit depuis l'admin
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const id = (body.id || '').trim();
        if (!id) return json({ ok: false, error: 'id_manquant' }, 400, allow);
        const patch = {};
        if (body.cat !== undefined) patch.cat = String(body.cat).slice(0, 40);
        if (body.brand !== undefined) patch.brand = (body.brand === null || body.brand === '') ? null : String(body.brand).slice(0, 40);
        if (body.price !== undefined) { const pr = Number(body.price); if (!isNaN(pr) && pr >= 0 && pr < 10000) patch.price = Math.round(pr * 100) / 100; }
        if (body.desc !== undefined) patch.desc = String(body.desc).slice(0, 600);
        if (body.stock !== undefined) { const st = parseInt(body.stock, 10); patch.stock = isNaN(st) ? null : Math.max(0, Math.min(999999, st)); }
        if (body.available !== undefined) patch.available = !!body.available;
        if (body.img !== undefined) { const im = String(body.img || ''); if (im === '') patch.img = null; else if (im.length < 900000) patch.img = im; }
        if (body.old !== undefined) { if (body.old === null || body.old === '') patch.old = null; else { const od = Number(body.old); if (!isNaN(od) && od >= 0 && od < 10000) patch.old = Math.round(od * 100) / 100; } }
        if (body.sub !== undefined) patch.sub = (body.sub === null || body.sub === '') ? null : String(body.sub).slice(0, 40);
        if (body.deleted !== undefined) patch.deleted = !!body.deleted;
        await fetch(fbUrl(env, 'catalog/' + encodeURIComponent(id)), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
        return json({ ok: true }, 200, allow);
      }

      return json({ ok: false, error: 'not_found' }, 404, allow);
    } catch (err) {
      return json({ ok: false, error: 'server_error' }, 500, allow);
    }
  }
};

/* -----------------------------------------------------------------------------
   NOTE DMARC (leçon LinkedIA) : envoyer un email "depuis" une adresse @gmail.com
   via Brevo échoue (DMARC → différé/spam). Pour /contact et les confirmations :
   - idéal : SENDER_EMAIL sur un vrai domaine (SPF/DKIM Brevo configurés), ex hello@mycandys.fr
   - sinon : repli Web3Forms OU garder le mailto.
   ----------------------------------------------------------------------------- */
