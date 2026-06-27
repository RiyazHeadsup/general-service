const WhatsappConfig = require('../models/WhatsappConfig');
const WhatsappOptIn = require('../models/WhatsappOptIn');

const GRAPH = 'https://graph.facebook.com/v21.0';

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
