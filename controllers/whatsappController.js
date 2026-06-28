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
      const vals = [name, billNumber, date, services, amount, wallet];
      const parameters = vals.map((v) => ({ type: 'text', text: String(v == null || v === '' ? '-' : v) }));

      const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: lang }, components: [{ type: 'body', parameters }] },
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
      const components = params.length
        ? [{ type: 'body', parameters: params.map((v) => ({ type: 'text', text: String(v == null || v === '' ? '-' : v) })) }]
        : [];

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
