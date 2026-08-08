const WhatsappConfig = require('../models/WhatsappConfig');
const WhatsappOptIn = require('../models/WhatsappOptIn');
const WhatsappBillSend = require('../models/WhatsappBillSend');
const Client = require('../models/Client');

const GRAPH = 'https://graph.facebook.com/v21.0';

// Format a phone number to E.164 digits (no +). Prepends country code if local.
function formatPhone(raw, cc) {
  let d = String(raw == null ? '' : raw).replace(/[^\d]/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (cc && d.length <= 10) d = String(cc).replace(/[^\d]/g, '') + d;
  return d;
}

// Upload a document to Meta and return its media id.
// The panel sends the invoice as base64, so the PDF never has to be hosted on a
// public URL — Meta keeps the media for ~30 days, long enough to deliver.
async function uploadMedia(cfg, base64, filename, mimeType) {
  const buf = Buffer.from(String(base64), 'base64');
  if (!buf.length) throw new Error('Empty document');

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', new Blob([buf], { type: mimeType }), filename);

  const r = await fetch(`${GRAPH}/${cfg.phoneNumberId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}` },
    body: form,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error || !j.id) {
    throw new Error(j.error ? j.error.message : 'Document upload failed');
  }
  return j.id;
}

// Media allowed in a template header, with Meta's per-type size ceiling.
const HEADER_MEDIA = {
  'video/mp4': { format: 'VIDEO', max: 16 * 1024 * 1024, ext: 'mp4' },
  'video/3gpp': { format: 'VIDEO', max: 16 * 1024 * 1024, ext: '3gp' },
  'image/jpeg': { format: 'IMAGE', max: 5 * 1024 * 1024, ext: 'jpg' },
  'image/png': { format: 'IMAGE', max: 5 * 1024 * 1024, ext: 'png' },
  'application/pdf': { format: 'DOCUMENT', max: 100 * 1024 * 1024, ext: 'pdf' },
};

// Upload a file through Meta's Resumable Upload API and return its file handle.
//
// A template's header media is fixed at creation time: Meta wants a *handle*
// (not a media id) as the header example, and handles only come from this API.
// It is a two-step dance — open a session against the App ID, then push the
// bytes — and it is separate from the /media upload used when *sending*.
async function uploadResumable(cfg, buf, mimeType, filename) {
  if (!cfg.appId) {
    throw new Error('App ID is missing — add it in WhatsApp Setup to upload template media');
  }

  const q = new URLSearchParams({
    file_name: filename,
    file_length: String(buf.length),
    file_type: mimeType,
    access_token: cfg.token,
  });
  const startRes = await fetch(`${GRAPH}/${cfg.appId}/uploads?${q}`, { method: 'POST' });
  const start = await startRes.json().catch(() => ({}));
  if (!startRes.ok || start.error || !start.id) {
    throw new Error(start.error ? start.error.message : 'Could not start media upload');
  }

  // Single-shot transfer: our ceiling is 16 MB, well within one request.
  const upRes = await fetch(`${GRAPH}/${start.id}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${cfg.token}`,
      file_offset: '0',
      'Content-Type': 'application/octet-stream',
    },
    body: buf,
  });
  const up = await upRes.json().catch(() => ({}));
  if (!upRes.ok || up.error || !up.h) {
    throw new Error(up.error ? up.error.message : 'Media upload failed');
  }
  return up.h;
}

// Build the HEADER component for a template definition (create/edit).
function headerComponent(format, handle) {
  return {
    type: 'HEADER',
    format: String(format).toUpperCase(),
    example: { header_handle: [handle] },
  };
}

// Inbound-message intent. Consent has to be started by the customer — a
// wa.me link on the site or a QR at the counter opens WhatsApp with the text
// already written, so we match on that phrase rather than on "any message":
// "is my appointment at 5?" is not permission to market to someone.
const CONSENT_PHRASES = [
  'receive your latest offers',
  'offers and updates on whatsapp',
  'send me offers',
  'yes, send me offers',
];
// Whole-message match, so "stop by tomorrow?" never unsubscribes anyone.
const STOP_WORDS = ['stop', 'unsubscribe', 'optout', 'opt out', 'opt-out', 'band karo', 'band karein', 'mat bhejo', 'mat bhejein'];
const START_WORDS = ['start', 'subscribe', 'optin', 'opt in', 'opt-in', 'resume', 'yes'];

function consentIntent(text) {
  const t = String(text || '').trim().toLowerCase().replace(/[.!,]+$/, '');
  if (!t) return null;
  if (STOP_WORDS.includes(t)) return 'stop';
  if (START_WORDS.includes(t)) return 'start';
  if (CONSENT_PHRASES.some((p) => t.includes(p))) return 'start';
  return null;
}

// Strip the access token before sending config to the client.
function publicConfig(cfg) {
  if (!cfg) return null;
  const o = cfg.toObject ? cfg.toObject() : cfg;
  const { token, ...rest } = o;
  return { ...rest, tokenSet: !!token };
}

async function getOrCreateConfig() {
  let cfg = await WhatsappConfig.findOne({ key: 'default' });
  if (!cfg) cfg = await WhatsappConfig.create({ key: 'default' });
  return cfg;
}

// Pull the BODY text out of a Meta template's components array.
function templateBody(components) {
  const body = (components || []).find((c) => String(c.type || '').toUpperCase() === 'BODY');
  return body ? (body.text || '') : '';
}

// Normalise a template name to what Meta accepts (lowercase, digits, underscore).
function normName(name) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

class WhatsappController {
  // ── Config ───────────────────────────────────────────────
  async getWhatsappConfig(req, res) {
    try {
      const cfg = await getOrCreateConfig();
      res.json({ statusCode: 200, data: publicConfig(cfg) });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  async saveWhatsappConfig(req, res) {
    try {
      const { token, phoneNumberId, wabaId, appId, defaultCountryCode, verifyToken } = req.body;
      const cfg = await getOrCreateConfig();

      if (typeof phoneNumberId === 'string') cfg.phoneNumberId = phoneNumberId.trim();
      if (typeof wabaId === 'string') cfg.wabaId = wabaId.trim();
      if (typeof appId === 'string') cfg.appId = appId.trim();
      if (typeof defaultCountryCode === 'string') cfg.defaultCountryCode = defaultCountryCode.trim() || '91';
      if (typeof verifyToken === 'string') cfg.verifyToken = verifyToken.trim();
      // Only overwrite the token if a new non-empty one was provided.
      if (typeof token === 'string' && token.trim()) cfg.token = token.trim();

      // Best-effort connection test (sets verifiedName / quality / display number).
      if (cfg.token && cfg.phoneNumberId) {
        try {
          const url = `${GRAPH}/${cfg.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating&access_token=${encodeURIComponent(cfg.token)}`;
          const r = await fetch(url);
          const j = await r.json().catch(() => ({}));
          if (r.ok && !j.error) {
            cfg.displayPhoneNumber = j.display_phone_number || cfg.displayPhoneNumber;
            cfg.verifiedName = j.verified_name || cfg.verifiedName;
            cfg.qualityRating = j.quality_rating || cfg.qualityRating;
          }
        } catch { /* ignore — saving config should not fail on a test */ }
      }

      await cfg.save();
      res.json({ statusCode: 200, data: publicConfig(cfg) });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Opt-ins list (for the panel) ─────────────────────────
  async listWhatsappOptIns(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 200,
        sort: req.body.sort || { lastInboundAt: -1 }
      };
      const result = await WhatsappOptIn.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Send a bill receipt (UTILITY template) to a customer ─
  async sendBill(req, res) {
    try {
      const { phone, name, billNumber, date, services, amount, wallet } = req.body;
      if (!phone) return res.status(400).json({ statusCode: 400, error: 'phone is required' });

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.phoneNumberId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      const to = formatPhone(phone, cfg.defaultCountryCode);
      if (!to || to.length < 8) return res.status(400).json({ statusCode: 400, error: 'Invalid phone number' });

      const templateName = req.body.templateName || 'bill_receipt_v2';
      const lang = req.body.languageCode || 'en';
      // `params` lets the panel drive a template with its own variable list
      // (the PDF template takes just name + amount). Without it we fall back to
      // the six positional variables of the original text-only template.
      const vals = Array.isArray(req.body.params) && req.body.params.length
        ? req.body.params
        : [name, billNumber, date, services, amount, wallet];
      const parameters = vals.map((v) => ({ type: 'text', text: String(v == null || v === '' ? '-' : v) }));

      const components = [];

      // Optional PDF invoice in the template's document header.
      if (req.body.documentBase64) {
        const filename = req.body.documentFilename || `${billNumber || 'invoice'}.pdf`;
        let mediaId;
        try {
          mediaId = await uploadMedia(cfg, req.body.documentBase64, filename, 'application/pdf');
        } catch (e) {
          return res.status(400).json({ statusCode: 400, error: e.message });
        }
        components.push({
          type: 'header',
          parameters: [{ type: 'document', document: { id: mediaId, filename } }],
        });
      } else if (req.body.documentUrl) {
        components.push({
          type: 'header',
          parameters: [{
            type: 'document',
            document: { link: req.body.documentUrl, filename: req.body.documentFilename || 'invoice.pdf' },
          }],
        });
      }

      components.push({ type: 'body', parameters });

      const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: lang }, components },
      };

      const r = await fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Send failed' });
      }
      const messageId = j.messages && j.messages[0] && j.messages[0].id;

      // Record that this bill was sent (so the panel can show "Already sent").
      let sentAt = new Date();
      if (req.body.billId) {
        try {
          const rec = await WhatsappBillSend.findOneAndUpdate(
            { billId: String(req.body.billId) },
            { $set: { billNumber: billNumber || '', phone: to, messageId: messageId || '', sentAt } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          sentAt = rec.sentAt;
        } catch { /* ignore record errors — message already sent */ }
      }
      return res.json({ statusCode: 200, data: { id: messageId, to, sentAt } });
    } catch (error) {
      return res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Send a MARKETING template to an opted-in client ──────
  // No 24-hour window needed: marketing templates can be sent anytime to a
  // client who has explicitly opted in. We enforce that consent server-side.
  async sendMarketingMessage(req, res) {
    try {
      const { phone, templateName } = req.body;
      if (!phone) return res.status(400).json({ statusCode: 400, error: 'phone is required' });
      if (!templateName) return res.status(400).json({ statusCode: 400, error: 'templateName is required' });

      // Compliance guard — only send to a client who gave marketing consent.
      const last10 = String(phone).replace(/[^\d]/g, '').slice(-10);
      if (last10.length !== 10) return res.status(400).json({ statusCode: 400, error: 'Invalid phone number' });
      const client = await Client.findOne({
        phoneNumber: { $regex: last10 + '$' },
        whatsappOptIn: true,
      });
      if (!client) {
        return res.status(403).json({
          statusCode: 403,
          error: 'This client has not opted in to WhatsApp marketing',
        });
      }

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.phoneNumberId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      const to = formatPhone(phone, cfg.defaultCountryCode);
      if (!to || to.length < 8) return res.status(400).json({ statusCode: 400, error: 'Invalid phone number' });

      const lang = req.body.languageCode || 'en';
      // Body variables are optional — many marketing templates have none.
      const params = Array.isArray(req.body.params) ? req.body.params : [];
      const components = [];

      // Media header — the template's handle only covers Meta's review sample,
      // so every send has to carry the actual media. Callers pass a media id
      // (from uploadTemplateMedia, reused across a campaign) or a public link.
      const headerType = String(req.body.headerType || '').toLowerCase();
      if (headerType && (req.body.headerMediaId || req.body.headerMediaUrl)) {
        const media = req.body.headerMediaId
          ? { id: req.body.headerMediaId }
          : { link: req.body.headerMediaUrl };
        if (headerType === 'document') media.filename = req.body.headerFilename || 'file.pdf';
        components.push({ type: 'header', parameters: [{ type: headerType, [headerType]: media }] });
      }

      if (params.length) {
        components.push({
          type: 'body',
          parameters: params.map((v) => ({ type: 'text', text: String(v == null || v === '' ? '-' : v) })),
        });
      }

      const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: lang }, components },
      };

      const r = await fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Send failed' });
      }
      const messageId = j.messages && j.messages[0] && j.messages[0].id;
      return res.json({ statusCode: 200, data: { id: messageId, to, name: client.name, sentAt: new Date() } });
    } catch (error) {
      return res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Has a bill already been sent on WhatsApp? ────────────
  async billSentStatus(req, res) {
    try {
      const { billId } = req.body;
      if (!billId) return res.json({ statusCode: 200, data: { sent: false } });
      const rec = await WhatsappBillSend.findOne({ billId: String(billId) });
      return res.json({ statusCode: 200, data: { sent: !!rec, sentAt: rec ? rec.sentAt : null } });
    } catch (error) {
      return res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Message templates: list from Meta (with status & category) ──
  async listTemplates(req, res) {
    try {
      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.wabaId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }
      const fields = 'id,name,status,category,language,components';
      let url = `${GRAPH}/${cfg.wabaId}/message_templates?fields=${fields}&limit=200&access_token=${encodeURIComponent(cfg.token)}`;
      const all = [];
      let guard = 0;
      // A WABA can return templates across several pages — follow paging.next.
      while (url && guard < 25) {
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.error) {
          return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Failed to fetch templates' });
        }
        for (const t of j.data || []) {
          all.push({
            id: t.id,
            name: t.name,
            status: t.status,        // APPROVED | PENDING | REJECTED | PAUSED | DISABLED | ...
            category: t.category,    // MARKETING | UTILITY | AUTHENTICATION
            language: t.language,
            body: templateBody(t.components),
            components: t.components || [],
          });
        }
        url = j.paging && j.paging.next ? j.paging.next : null;
        guard++;
      }
      res.json({ statusCode: 200, data: all });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Upload media for a template header ───────────────────
  // Returns both ids the panel needs: `handle` to define the template (review
  // sample) and `mediaId` to attach the real media on every send.
  async uploadTemplateMedia(req, res) {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) return res.status(400).json({ statusCode: 400, error: 'fileBase64 is required' });

      const mimeType = String(req.body.mimeType || 'video/mp4').toLowerCase();
      const rules = HEADER_MEDIA[mimeType];
      if (!rules) {
        return res.status(400).json({
          statusCode: 400,
          error: `Unsupported file type ${mimeType}. Use MP4 video, JPEG/PNG image or PDF.`,
        });
      }

      const buf = Buffer.from(String(fileBase64), 'base64');
      if (!buf.length) return res.status(400).json({ statusCode: 400, error: 'Empty file' });
      if (buf.length > rules.max) {
        const mb = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
        return res.status(400).json({
          statusCode: 400,
          error: `File is ${mb(buf.length)} — WhatsApp allows up to ${mb(rules.max)} for ${rules.format.toLowerCase()}. Please compress it.`,
        });
      }

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.phoneNumberId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      const filename = req.body.filename || `header.${rules.ext}`;
      const handle = await uploadResumable(cfg, buf, mimeType, filename);
      const mediaId = await uploadMedia(cfg, fileBase64, filename, mimeType);

      return res.json({
        statusCode: 200,
        data: { handle, mediaId, format: rules.format, mimeType, filename, size: buf.length },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, error: error.message });
    }
  }

  // ── Create a template (submitted to Meta → becomes PENDING) ──
  async createTemplate(req, res) {
    try {
      const { name, body } = req.body;
      if (!name || !body) return res.status(400).json({ statusCode: 400, error: 'name and body are required' });

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.wabaId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      const component = { type: 'BODY', text: String(body) };
      // Meta requires example values when the body has {{1}}, {{2}}, … placeholders.
      if (Array.isArray(req.body.example) && req.body.example.length) {
        component.example = { body_text: [req.body.example.map((v) => String(v == null ? '' : v))] };
      }

      // Optional media header (video/image/document), uploaded beforehand via
      // uploadTemplateMedia — the header must come before the body.
      const components = [];
      if (req.body.headerHandle && req.body.headerFormat) {
        components.push(headerComponent(req.body.headerFormat, req.body.headerHandle));
      }
      components.push(component);

      const payload = {
        name: normName(name),
        category: String(req.body.category || 'MARKETING').toUpperCase(),
        language: req.body.language || 'en',
        components,
      };

      const r = await fetch(`${GRAPH}/${cfg.wabaId}/message_templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Create failed' });
      }
      res.json({ statusCode: 200, data: j });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Edit a template (Meta edits by template id; name/language fixed) ──
  async editTemplate(req, res) {
    try {
      const { id, body } = req.body;
      if (!id) return res.status(400).json({ statusCode: 400, error: 'template id is required' });

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      const payload = {};
      if (req.body.category) payload.category = String(req.body.category).toUpperCase();
      if (typeof body === 'string') {
        const component = { type: 'BODY', text: body };
        if (Array.isArray(req.body.example) && req.body.example.length) {
          component.example = { body_text: [req.body.example.map((v) => String(v == null ? '' : v))] };
        }
        // Meta replaces the whole component list on edit, so a template that
        // keeps its media header must resend it with a fresh handle.
        const components = [];
        if (req.body.headerHandle && req.body.headerFormat) {
          components.push(headerComponent(req.body.headerFormat, req.body.headerHandle));
        }
        components.push(component);
        payload.components = components;
      }

      const r = await fetch(`${GRAPH}/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Edit failed' });
      }
      res.json({ statusCode: 200, data: j });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Delete a template by name (optionally a single id) ──
  async deleteTemplate(req, res) {
    try {
      const { name, id } = req.body;
      if (!name) return res.status(400).json({ statusCode: 400, error: 'template name is required' });

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (!cfg || !cfg.token || !cfg.wabaId) {
        return res.status(400).json({ statusCode: 400, error: 'WhatsApp is not configured' });
      }

      let url = `${GRAPH}/${cfg.wabaId}/message_templates?name=${encodeURIComponent(name)}`;
      if (id) url += `&hsm_id=${encodeURIComponent(id)}`;
      url += `&access_token=${encodeURIComponent(cfg.token)}`;

      const r = await fetch(url, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        return res.status(400).json({ statusCode: 400, error: j.error ? j.error.message : 'Delete failed' });
      }
      res.json({ statusCode: 200, data: j });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // ── Webhook: verification (GET) ──────────────────────────
  // Meta calls: GET ...?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const cfg = await WhatsappConfig.findOne({ key: 'default' });
      if (mode === 'subscribe' && cfg && token && token === cfg.verifyToken) {
        cfg.webhookVerified = true;
        await cfg.save();
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    } catch (error) {
      return res.sendStatus(403);
    }
  }

  // ── Webhook: incoming messages (POST) ────────────────────
  async receiveWebhook(req, res) {
    // Acknowledge immediately so Meta doesn't retry.
    res.sendStatus(200);
    try {
      const entries = req.body?.entry || [];
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const contacts = value.contacts || [];
          const nameByWaId = {};
          for (const c of contacts) nameByWaId[c.wa_id] = c.profile?.name || '';

          // Delivery receipts: sent → delivered → read, or failed (with reason).
          // This is the ONLY place Meta tells us if a message actually landed.
          for (const st of value.statuses || []) {
            if (st.status === 'failed') {
              const err = (st.errors && st.errors[0]) || {};
              console.error(
                `[WA][STATUS][FAILED] to=${st.recipient_id} id=${st.id} ` +
                `code=${err.code || '?'} title="${err.title || ''}" detail="${err.error_data?.details || err.message || ''}"`
              );
            } else {
              console.log(`[WA][STATUS] ${st.status} to=${st.recipient_id} id=${st.id}`);
            }
          }

          for (const msg of value.messages || []) {
            const phone = msg.from;
            if (!phone) continue;
            const text =
              msg.text?.body ||
              msg.button?.text ||
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              `[${msg.type || 'message'}]`;
            const when = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date();

            await WhatsappOptIn.findOneAndUpdate(
              { phone },
              {
                $set: {
                  name: nameByWaId[phone] || undefined,
                  lastMessage: text,
                  lastInboundAt: when
                },
                $inc: { messageCount: 1 },
                $setOnInsert: { phone, optInAt: when }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Customer-initiated consent (or opt-out) — the only kind Meta
            // accepts for marketing. Store their own words as the proof.
            const intent = consentIntent(text);
            if (intent) {
              const optIn = intent === 'start';
              const last10 = String(phone).replace(/[^\d]/g, '').slice(-10);
              if (last10.length === 10) {
                const r = await Client.updateMany(
                  { phoneNumber: { $regex: last10 + '$' } },
                  {
                    $set: {
                      whatsappOptIn: optIn,
                      whatsappOptInText: text,
                      whatsappOptInAt: when,
                      whatsappOptInSource: optIn ? 'whatsapp_inbound' : 'whatsapp_stop',
                    },
                  }
                );
                console.log(`[WA][CONSENT] ${intent} from=${phone} clientsUpdated=${r.modifiedCount}`);
                // No client record yet (a website visitor who has never been
                // billed): the WhatsappOptIn row above still holds the proof.
                if (optIn && r.matchedCount === 0) {
                  console.log(`[WA][CONSENT] no client for ${phone} — consent recorded, link it when they are billed`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Already responded 200; just log.
      console.error('WhatsApp webhook error:', error.message);
    }
  }
}

module.exports = new WhatsappController();
