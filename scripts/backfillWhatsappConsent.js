/**
 * One-time backfill for WhatsApp marketing consent.
 *
 * Before the consent fields existed on WhatsappOptIn, an inbound message that
 * clearly asked for offers was matched, used to flag any *existing* Client, and
 * then dropped. Anyone who had not been billed yet left no consent behind —
 * their words are still sitting in `lastMessage`, so we can recover them.
 *
 * This script re-runs the live webhook's own consentIntent() over every stored
 * message and:
 *   1. sets optIn / optInText / optInSource / consentAt on the opt-in row
 *   2. mirrors the consent onto a matching Client, if one exists by now
 *
 * Safe to run more than once — every write is idempotent.
 *
 * Dry run (default, changes nothing):   node scripts/backfillWhatsappConsent.js
 * Apply:                                node scripts/backfillWhatsappConsent.js --apply
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WhatsappOptIn = require('../models/WhatsappOptIn');
const Client = require('../models/Client');
const { consentIntent } = require('../controllers/whatsappController');

const APPLY = process.argv.includes('--apply');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/generalservice';
  await mongoose.connect(uri);
  console.log(`connected · ${APPLY ? 'APPLY' : 'DRY RUN — nothing will be written'}\n`);

  const rows = await WhatsappOptIn.find({}).lean();
  let optedIn = 0, optedOut = 0, linked = 0, unlinked = 0, skipped = 0;

  for (const row of rows) {
    const intent = consentIntent(row.lastMessage);
    if (!intent) { skipped++; continue; }

    const optIn = intent === 'start';
    // Do not overwrite a consent decision already recorded on the row.
    if (row.optInSource) { skipped++; continue; }

    const source = optIn ? 'whatsapp_inbound' : 'whatsapp_stop';
    const when = row.lastInboundAt || row.optInAt || row.updatedAt;
    const last10 = String(row.phone || '').replace(/[^\d]/g, '').slice(-10);

    let clientCount = 0;
    if (last10.length === 10) {
      clientCount = await Client.countDocuments({ phoneNumber: { $regex: last10 + '$' } });
    }

    if (APPLY) {
      await WhatsappOptIn.updateOne(
        { _id: row._id },
        { $set: { optIn, optInText: row.lastMessage, optInSource: source, consentAt: when } }
      );
      if (clientCount > 0) {
        await Client.updateMany(
          { phoneNumber: { $regex: last10 + '$' } },
          {
            $set: {
              whatsappOptIn: optIn,
              whatsappOptInText: row.lastMessage,
              whatsappOptInAt: when,
              whatsappOptInSource: source,
            },
          }
        );
      }
    }

    if (optIn) optedIn++; else optedOut++;
    if (clientCount > 0) linked++; else unlinked++;

    console.log(
      `${optIn ? 'OPT-IN ' : 'OPT-OUT'} ${row.phone} · ${row.name || 'Unknown'} · ` +
      `clients=${clientCount} · "${String(row.lastMessage).slice(0, 60)}"`
    );
  }

  console.log(
    `\nscanned ${rows.length} · opt-in ${optedIn} · opt-out ${optedOut} · ` +
    `already-a-client ${linked} · not-a-client-yet ${unlinked} · no consent phrase ${skipped}`
  );
  if (!APPLY) console.log('\nDry run — re-run with --apply to write these changes.');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
