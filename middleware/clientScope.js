const mongoose = require('mongoose');

// The gateway sets `x-client-id` only for customer (OTP-login) tokens, after
// stripping any value the caller sent. Requests without it are staff/admin and
// pass through untouched.
//
// For customer requests every client reference in the body is overwritten with
// the header value. Callers already send their own id in these fields, so
// overwriting doesn't change behaviour for honest callers.

// Profile fields a customer may edit on their own Client. Everything else
// (phoneNumber, walletId, points, memberShip, unpaidAmt, unitIds, customerType…)
// is staff-managed.
const CLIENT_EDITABLE = [
  'name', 'email', 'gender', 'img', 'address', 'dob', 'ageGroup',
  'whatsappOptIn', 'whatsappOptInText', 'whatsappOptInAt', 'whatsappOptInSource'
];

// Combine the caller's filter with the ownership filter. `$and` so a caller's
// own `$or` or `_id` can't widen it.
const within = (search, owner) => ({ $and: [search && typeof search === 'object' ? search : {}, owner] });

// Each rule (req, res, cid) may rewrite req.body, or send a response to stop
// the request.
const rules = {
  '/searchClients': (req, res, cid) => {
    req.body.search = within(req.body.search, { _id: cid });
    delete req.body.populate;
  },
  '/updateClients': (req, res, cid) => {
    const body = req.body;
    const update = { _id: cid };
    for (const k of CLIENT_EDITABLE) if (body[k] !== undefined) update[k] = body[k];
    // The app logs a soft-deleted customer back in by reactivating them. That
    // is the only change allowed to these fields.
    if (body.isActive === true) Object.assign(update, { isActive: true, deletedAt: null, deleteReason: null });
    req.body = update;
  },
  '/deleteAccount': (req, res, cid) => { req.body._id = cid; },

  '/registerPushToken': (req, res, cid) => { req.body.clientId = cid; },
  '/removePushToken': (req, res, cid) => { req.body.clientId = cid; },
  '/getClientNotifications': (req, res, cid) => { req.body.clientId = cid; }
};

const clientScope = async (req, res, next) => {
  const cid = req.headers['x-client-id'];
  if (!cid) return next();

  if (!mongoose.isValidObjectId(cid)) {
    return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid client' });
  }

  const rule = rules[req.path];
  if (!rule) return next();

  try {
    req.body = req.body || {};
    await rule(req, res, cid);
    if (!res.headersSent) next();
  } catch (error) {
    console.error('[CLIENT_SCOPE]', req.path, error);
    res.status(500).json({ success: false, statusCode: 500, message: 'Request failed' });
  }
};

module.exports = { clientScope };
