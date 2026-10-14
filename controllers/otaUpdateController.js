const path = require('path');
const OtaUpdate = require('../models/OtaUpdate');
const { getBucket } = require('../config/firebase');

// Ported from the old backend's app-control-service. Differences:
// - The bundle arrives as base64 JSON (`fileBase64`), because the gateway
//   re-streams every body as JSON and can't proxy multipart.
// - The Storage path is stored, so delete actually removes the file.

const ALLOWED_EXTENSIONS = ['.zip', '.bundle', '.jsbundle', '.gz'];
const MAX_BUNDLE_BYTES = 20 * 1024 * 1024;

// Firebase download URL → object path, for records saved before storagePath existed
const storagePathFromUrl = (url) => {
  const match = /\/o\/([^?]+)/.exec(url || '');
  return match ? decodeURIComponent(match[1]) : '';
};

const addOtaUpdate = async (req, res) => {
  try {
    const otaUpdate = new OtaUpdate(req.body);
    await otaUpdate.save();
    res.status(201).json({ success: true, statusCode: 201, message: 'OTA update created successfully', data: otaUpdate });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error creating OTA update', error: error.message });
  }
};

// Upload a bundle to Firebase Storage and publish it as an OTA update.
// Body: { fileBase64, fileName, version, buildNumber, platform, app, releaseNotes, forceUpdate, releasedBy }
const uploadOtaBundle = async (req, res) => {
  try {
    const { fileBase64, fileName = 'ota-bundle.zip', version, buildNumber, minBuildNumber = 0, platform = 'both', app = 'partner', releaseNotes = '', forceUpdate = false, releasedBy = '' } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'fileBase64 is required' });
    }
    if (!version || !buildNumber) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'version and buildNumber are required' });
    }
    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ success: false, statusCode: 400, message: `File type ${ext || '(none)'} not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}` });
    }

    // Accept a bare base64 string or a data: URL
    const buffer = Buffer.from(String(fileBase64).replace(/^data:[^,]*,/, ''), 'base64');
    if (!buffer.length || buffer.length > MAX_BUNDLE_BYTES) {
      return res.status(400).json({ success: false, statusCode: 400, message: `Bundle must be between 1 byte and ${MAX_BUNDLE_BYTES / 1024 / 1024}MB` });
    }

    const bucket = getBucket();
    const storagePath = `ota-bundles/${app}/${platform}/v${version}-build${buildNumber}-${Date.now()}${ext}`;
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: 'application/octet-stream',
        metadata: { version: String(version), buildNumber: String(buildNumber), platform, app }
      }
    });

    try {
      await file.makePublic();
    } catch (e) {
      console.log('makePublic skipped (rules may block it):', e.message);
    }

    const bundleUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    const otaUpdate = new OtaUpdate({
      version,
      buildNumber: parseInt(buildNumber, 10),
      minBuildNumber: parseInt(minBuildNumber, 10) || 0,
      platform,
      app,
      bundleUrl,
      storagePath,
      releaseNotes,
      releasedBy,
      forceUpdate: forceUpdate === 'true' || forceUpdate === true
    });
    await otaUpdate.save();

    res.status(201).json({ success: true, statusCode: 201, message: 'Bundle uploaded and OTA update published', data: otaUpdate });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error uploading bundle', error: error.message });
  }
};

const searchOtaUpdate = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'buildNumber', sortOrder = 'desc', ...filters } = req.body;
    const query = {};
    if (filters.platform) query.platform = filters.platform;
    if (filters.app) query.app = filters.app;
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;

    const result = await OtaUpdate.paginate(query, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    });
    res.json({ success: true, statusCode: 200, data: result });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

const updateOtaUpdate = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: '_id is required' });

    const otaUpdate = await OtaUpdate.findByIdAndUpdate(_id, updateData, { new: true });
    if (!otaUpdate) return res.status(404).json({ success: false, statusCode: 404, message: 'OTA update not found' });

    res.json({ success: true, statusCode: 200, message: 'OTA update updated', data: otaUpdate });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

const deleteOtaUpdate = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: '_id is required' });

    const otaUpdate = await OtaUpdate.findById(_id);
    if (!otaUpdate) return res.status(404).json({ success: false, statusCode: 404, message: 'OTA update not found' });

    const storagePath = otaUpdate.storagePath || storagePathFromUrl(otaUpdate.bundleUrl);
    if (storagePath) {
      try {
        await getBucket().file(storagePath).delete();
      } catch (e) {
        console.log('Firebase file delete failed (may not exist):', e.message);
      }
    }

    await OtaUpdate.findByIdAndDelete(_id);
    res.json({ success: true, statusCode: 200, message: 'OTA update deleted' });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

// Public (gateway /public/checkOtaUpdate). Body: { buildNumber, platform, app }
const checkOtaUpdate = async (req, res) => {
  try {
    const { platform, app = 'partner' } = req.body;
    const buildNumber = Number(req.body.buildNumber);

    if (!Number.isFinite(buildNumber) || !platform) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'buildNumber and platform are required' });
    }

    const latestOta = await OtaUpdate.findOne({
      isActive: true,
      app: String(app),
      platform: { $in: [String(platform), 'both'] },
      buildNumber: { $gt: buildNumber },
      $or: [{ minBuildNumber: null }, { minBuildNumber: { $lte: buildNumber } }]
    }).sort({ buildNumber: -1 });

    if (!latestOta) {
      return res.json({ success: true, statusCode: 200, data: { updateAvailable: false } });
    }

    res.json({
      success: true,
      statusCode: 200,
      data: {
        updateAvailable: true,
        forceUpdate: latestOta.forceUpdate,
        version: latestOta.version,
        buildNumber: latestOta.buildNumber,
        bundleUrl: latestOta.bundleUrl,
        releaseNotes: latestOta.releaseNotes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

module.exports = { addOtaUpdate, uploadOtaBundle, searchOtaUpdate, updateOtaUpdate, deleteOtaUpdate, checkOtaUpdate };
