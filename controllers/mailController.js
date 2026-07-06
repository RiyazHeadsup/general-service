const nodemailer = require('nodemailer');
const MailConfig = require('../models/MailConfig');
const MailTemplate = require('../models/MailTemplate');
const MailSent = require('../models/MailSent');

const CONFIG_KEY = 'default';

// ─── Helpers ────────────────────────────────────────────────
function buildTransport(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: Number(cfg.port) || 587,
    secure: !!cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// Merge {{Field}} and Word-style «Field» placeholders, with fuzzy matching so
// {{FirstName}} also fills a "First_Name" / "first name" column.
const MERGE_RE = /\{\{\s*([^}]+?)\s*\}\}|«\s*([^»]+?)\s*»/g;
const normKey = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function applyMerge(template, row) {
  return String(template || '').replace(MERGE_RE, (match, k1, k2) => {
    const k = (k1 || k2).trim();
    if (Object.prototype.hasOwnProperty.call(row, k)) {
      return row[k] == null ? '' : String(row[k]);
    }
    const nk = normKey(k);
    const hit = Object.keys(row).find((col) => normKey(col) === nk);
    return hit ? (row[hit] == null ? '' : String(row[hit])) : match;
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

// A readable plain-text fallback from an HTML body. Sending multipart
// (html + text) markedly improves inbox placement over html-only.
function htmlToText(html) {
  return String(html || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|tr|h[1-6]|li|table)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// A visible unsubscribe footer — legitimate bulk mail always has one, and its
// absence is a strong spam signal.
function withUnsubscribe(body, isHtml, senderEmail) {
  const line = `You’re receiving this email from ${senderEmail}. If you’d rather not, reply with “UNSUBSCRIBE” and we’ll remove you.`;
  if (isHtml) {
    return `${body}<div style="margin-top:26px;padding-top:14px;border-top:1px solid #ececec;color:#9aa0a6;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;text-align:center;">${line}</div>`;
  }
  return `${body}\n\n—\n${line}`;
}

// Build the nodemailer content + deliverability headers for a message.
// Always multipart (html + text) with a List-Unsubscribe header and footer.
function messageBody(body, isHtml, senderEmail) {
  const opts = {
    headers: { 'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>` },
    replyTo: senderEmail,
  };
  if (isHtml) {
    const html = withUnsubscribe(body, true, senderEmail);
    opts.html = html;
    opts.text = htmlToText(html);
  } else {
    opts.text = withUnsubscribe(body, false, senderEmail);
  }
  return opts;
}

// Attachments arrive as { filename, content(base64), contentType } from the browser.
function mapAttachments(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => a && a.filename && a.content)
    .map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, 'base64'),
      contentType: a.contentType || undefined,
    }));
}

// Config without the secret, plus a hasPassword flag.
function sanitize(doc) {
  if (!doc) return null;
  return {
    provider: doc.provider,
    host: doc.host,
    port: doc.port,
    secure: doc.secure,
    user: doc.user,
    fromName: doc.fromName,
    verified: doc.verified,
    lastVerifiedAt: doc.lastVerifiedAt,
    hasPassword: !!doc.pass,
  };
}

async function getConfigDoc() {
  return MailConfig.findOne({ key: CONFIG_KEY });
}

class MailController {
  // ─── Config ───────────────────────────────────────────────
  async getMailConfig(req, res) {
    try {
      const doc = await getConfigDoc();
      res.json({ success: true, statusCode: 200, data: sanitize(doc) });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async saveMailConfig(req, res) {
    try {
      const { provider, host, port, secure, user, pass, fromName } = req.body;
      if (!user || !isEmail(user)) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'A valid sender email is required' });
      }
      const existing = await getConfigDoc();
      const effectivePass = (pass && String(pass).trim()) ? pass : (existing ? existing.pass : '');
      if (!effectivePass) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'An app password is required' });
      }

      const next = {
        key: CONFIG_KEY,
        provider: provider || 'custom',
        host: host || '',
        port: Number(port) || 587,
        secure: !!secure,
        user: String(user).trim(),
        pass: effectivePass,
        fromName: (fromName || '').trim(),
      };

      // Verify before persisting the verified flag.
      let verified = false, verifyError = '';
      try {
        await buildTransport(next).verify();
        verified = true;
      } catch (err) {
        verifyError = err.message;
      }
      next.verified = verified;
      next.lastVerifiedAt = verified ? new Date() : (existing ? existing.lastVerifiedAt : null);

      const doc = await MailConfig.findOneAndUpdate(
        { key: CONFIG_KEY }, next, { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({
        success: true,
        statusCode: 200,
        message: verified ? 'Saved and connected' : 'Saved, but connection could not be verified',
        data: { ...sanitize(doc), verifyError },
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Test connection — uses the posted credentials, falling back to the stored
  // password when the user leaves it blank.
  async verifyMailSmtp(req, res) {
    try {
      const { host, port, secure, user, pass } = req.body;
      let effectivePass = (pass && String(pass).trim()) ? pass : '';
      if (!effectivePass) {
        const existing = await getConfigDoc();
        effectivePass = existing ? existing.pass : '';
      }
      if (!user || !effectivePass) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Enter your email and app password' });
      }
      await buildTransport({ host, port, secure, user, pass: effectivePass }).verify();
      res.json({ success: true, statusCode: 200, message: 'Connected' });
    } catch (error) {
      res.json({ success: false, statusCode: 400, error: error.message });
    }
  }

  // ─── Templates ────────────────────────────────────────────
  async listMailTemplates(req, res) {
    try {
      const items = await MailTemplate.find({ isActive: true }).sort({ updatedAt: -1 });
      res.json({ success: true, statusCode: 200, data: items });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Bulk-insert ready-made templates, skipping any whose name already exists.
  async seedMailTemplates(req, res) {
    try {
      const list = Array.isArray(req.body.templates) ? req.body.templates : [];
      if (!list.length) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'No templates provided' });
      }
      const existing = new Set((await MailTemplate.find({}, 'name')).map((t) => t.name));
      const toInsert = list
        .filter((t) => t && t.name && !existing.has(String(t.name).trim()))
        .map((t) => ({
          name: String(t.name).trim(),
          category: (t.category || 'Starters').trim(),
          subject: t.subject || '',
          body: t.body || '',
          isHtml: t.isHtml != null ? !!t.isHtml : true,
        }));
      if (toInsert.length) await MailTemplate.insertMany(toInsert);
      res.json({
        success: true, statusCode: 200,
        message: toInsert.length ? `Added ${toInsert.length} template${toInsert.length !== 1 ? 's' : ''}` : 'All templates already exist',
        data: { added: toInsert.length, skipped: list.length - toInsert.length },
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async createMailTemplate(req, res) {
    try {
      const { name, category, subject, body, isHtml } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Template name is required' });
      }
      const tpl = new MailTemplate({
        name: name.trim(),
        category: (category || 'My Templates').trim(),
        subject: subject || '',
        body: body || '',
        isHtml: isHtml != null ? !!isHtml : true,
      });
      await tpl.save();
      res.json({ success: true, statusCode: 200, message: 'Template created', data: tpl });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async editMailTemplate(req, res) {
    try {
      const { _id, name, category, subject, body, isHtml } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, error: 'Template id is required' });
      const update = {};
      if (name != null) update.name = String(name).trim();
      if (category != null) update.category = String(category).trim();
      if (subject != null) update.subject = subject;
      if (body != null) update.body = body;
      if (isHtml != null) update.isHtml = !!isHtml;
      const tpl = await MailTemplate.findByIdAndUpdate(_id, update, { new: true });
      if (!tpl) return res.status(404).json({ success: false, statusCode: 404, error: 'Template not found' });
      res.json({ success: true, statusCode: 200, message: 'Template updated', data: tpl });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteMailTemplate(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, error: 'Template id is required' });
      const tpl = await MailTemplate.findByIdAndDelete(_id);
      if (!tpl) return res.status(404).json({ success: false, statusCode: 404, error: 'Template not found' });
      res.json({ success: true, statusCode: 200, message: 'Template deleted' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // ─── Test send (single) ───────────────────────────────────
  async sendMailTest(req, res) {
    try {
      const { to, subject, body, isHtml, row, attachments } = req.body;
      const cfg = await getConfigDoc();
      if (!cfg || !cfg.user || !cfg.pass) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Set up a sending account first' });
      }
      const target = (to && to.trim()) || cfg.user;
      if (!isEmail(target)) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Enter a valid test address' });
      }
      const from = cfg.fromName ? `"${cfg.fromName.replace(/"/g, '')}" <${cfg.user}>` : cfg.user;
      const mergedSubject = applyMerge(subject || '(test) Mail marketing', row || {});
      const mergedBody = applyMerge(body || 'This is a test email.', row || {});
      const info = await buildTransport(cfg).sendMail({
        from, to: target, subject: mergedSubject,
        ...messageBody(mergedBody, isHtml, cfg.user),
        attachments: mapAttachments(attachments),
      });
      res.json({ success: true, statusCode: 200, message: `Test sent to ${target}`, data: { messageId: info.messageId } });
    } catch (error) {
      res.json({ success: false, statusCode: 400, error: error.message });
    }
  }

  // ─── Send merge ───────────────────────────────────────────
  async sendMailMerge(req, res) {
    try {
      const { emailColumn, subject, body, isHtml, rows, cc, bcc, delayMs, attachments } = req.body;
      const cfg = await getConfigDoc();
      if (!cfg || !cfg.user || !cfg.pass) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Set up a sending account first' });
      }
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'No recipients to send to' });
      }
      if (!emailColumn) {
        return res.status(400).json({ success: false, statusCode: 400, error: 'Pick the email column' });
      }

      const transport = buildTransport(cfg);
      const fromAddress = cfg.fromName ? `"${cfg.fromName.replace(/"/g, '')}" <${cfg.user}>` : cfg.user;
      const atts = mapAttachments(attachments);
      const report = [];
      const records = [];
      const delay = Number(delayMs) || 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || {};
        const to = String(row[emailColumn] || '').trim();
        const mergedSubject = applyMerge(subject, row);

        if (!isEmail(to)) {
          const rec = { to: to || `(row ${i + 1})`, subject: mergedSubject, ok: false, error: 'Invalid or missing email address' };
          report.push(rec);
          continue;
        }

        const mergedBody = applyMerge(body, row);
        try {
          const info = await transport.sendMail({
            from: fromAddress, to,
            cc: cc ? applyMerge(cc, row) : undefined,
            bcc: bcc ? applyMerge(bcc, row) : undefined,
            subject: mergedSubject,
            ...messageBody(mergedBody, isHtml, cfg.user),
            attachments: atts,
          });
          const rec = { to, subject: mergedSubject, body: mergedBody, isHtml: !!isHtml, ok: true, from: cfg.user, messageId: info.messageId };
          report.push(rec);
          records.push(rec);
        } catch (err) {
          const rec = { to, subject: mergedSubject, body: mergedBody, isHtml: !!isHtml, ok: false, from: cfg.user, error: err.message };
          report.push(rec);
          records.push(rec);
        }
        if (delay && i < rows.length - 1) await sleep(delay);
      }

      if (records.length) {
        try { await MailSent.insertMany(records); } catch { /* history best-effort */ }
      }
      const sent = report.filter((r) => r.ok).length;
      res.json({
        success: true, statusCode: 200,
        data: { report, sent, failed: report.length - sent, total: report.length },
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // ─── Sent history ─────────────────────────────────────────
  async listMailSent(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 50,
        sort: req.body.sort || { createdAt: -1 },
      };
      const result = await MailSent.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async clearMailSent(req, res) {
    try {
      await MailSent.deleteMany({});
      res.json({ success: true, statusCode: 200, message: 'Sent history cleared' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new MailController();
