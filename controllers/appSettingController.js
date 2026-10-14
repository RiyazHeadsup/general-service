const mongoose = require('mongoose');
const AppSetting = require('../models/AppSetting');

// Admin side of the customer app's key/value settings (`appsettings`). The
// gateway reads the same keys for the public getSalonMode / getWorkingHours.
//
// Keys used by the app:
//   salon_discovery_mode     'location' | 'list'
//   default_unit_id          unit id used in list mode
//   working_hours            { openTime, closeTime, isEnabled }
//   subscriptionFlowEnabled  boolean (unset = enabled)

const SALON_MODE_DESCRIPTION = {
  location: 'App uses GPS to find nearby salons',
  list: 'App shows all active salons without location'
};
const WORKING_HOURS_DEFAULTS = { openTime: '08:00', closeTime: '20:00', isEnabled: true };
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const getAppSetting = async (req, res) => {
  try {
    const { key } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ success: false, statusCode: 400, message: 'Key is required' });
    const setting = await AppSetting.findOne({ key });
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: setting ? { key: setting.key, value: setting.value, description: setting.description } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

// Create or update by key
const setAppSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ success: false, statusCode: 400, message: 'Key is required' });
    if (value === undefined) return res.status(400).json({ success: false, statusCode: 400, message: 'Value is required' });
    const setting = await AppSetting.findOneAndUpdate(
      { key },
      { key, value, description },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, statusCode: 200, message: 'Setting saved successfully', data: setting });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const getAllAppSettings = async (req, res) => {
  try {
    const settings = await AppSetting.find({ isActive: true }).sort({ key: 1 });
    res.status(200).json({ success: true, statusCode: 200, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const getSalonMode = async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: 'salon_discovery_mode' });
    const defaultUnit = await AppSetting.findOne({ key: 'default_unit_id' });
    const mode = setting?.value || 'location';
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        mode,
        locationEnabled: mode === 'location',
        defaultUnitId: defaultUnit?.value || null,
        description: mode === 'location' ? SALON_MODE_DESCRIPTION.location : SALON_MODE_DESCRIPTION.list
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const toggleSalonMode = async (req, res) => {
  try {
    const { mode, defaultUnitId } = req.body || {};
    if (!mode || !['location', 'list'].includes(mode)) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'Mode must be "location" or "list"' });
    }
    if (defaultUnitId && !mongoose.isValidObjectId(defaultUnitId)) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'Invalid defaultUnitId' });
    }

    const setting = await AppSetting.findOneAndUpdate(
      { key: 'salon_discovery_mode' },
      { key: 'salon_discovery_mode', value: mode, description: SALON_MODE_DESCRIPTION[mode] },
      { new: true, upsert: true }
    );
    if (mode === 'list' && defaultUnitId) {
      await AppSetting.findOneAndUpdate(
        { key: 'default_unit_id' },
        { key: 'default_unit_id', value: String(defaultUnitId), description: 'Default salon unit for list mode' },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Salon mode set to "${mode}"`,
      data: { ...setting.toObject(), defaultUnitId: defaultUnitId || null }
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const getWorkingHours = async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: 'working_hours' });
    const hours = setting?.value || WORKING_HOURS_DEFAULTS;
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        openTime: hours.openTime || WORKING_HOURS_DEFAULTS.openTime,
        closeTime: hours.closeTime || WORKING_HOURS_DEFAULTS.closeTime,
        isEnabled: hours.isEnabled !== undefined ? hours.isEnabled : true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const setWorkingHours = async (req, res) => {
  try {
    const { openTime, closeTime, isEnabled } = req.body || {};
    if (openTime && !TIME_RE.test(openTime)) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'openTime must be in HH:MM format (e.g. 08:00)' });
    }
    if (closeTime && !TIME_RE.test(closeTime)) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'closeTime must be in HH:MM format (e.g. 20:00)' });
    }

    const current = await AppSetting.findOne({ key: 'working_hours' });
    const existing = current?.value || WORKING_HOURS_DEFAULTS;
    const updated = {
      openTime: openTime || existing.openTime || WORKING_HOURS_DEFAULTS.openTime,
      closeTime: closeTime || existing.closeTime || WORKING_HOURS_DEFAULTS.closeTime,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : (existing.isEnabled !== undefined ? existing.isEnabled : true)
    };

    await AppSetting.findOneAndUpdate(
      { key: 'working_hours' },
      { key: 'working_hours', value: updated, description: `App working hours: ${updated.openTime} - ${updated.closeTime}` },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Working hours set to ${updated.openTime} - ${updated.closeTime}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

// Unset means enabled (the app's original behaviour)
const getSubscriptionFlow = async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: 'subscriptionFlowEnabled' });
    res.status(200).json({ success: true, statusCode: 200, data: { enabled: setting?.value !== false } });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

const toggleSubscriptionFlow = async (req, res) => {
  try {
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, statusCode: 400, message: 'enabled (boolean) is required' });
    }
    const setting = await AppSetting.findOneAndUpdate(
      { key: 'subscriptionFlowEnabled' },
      {
        key: 'subscriptionFlowEnabled',
        value: enabled,
        description: enabled
          ? 'App uses subscription-based booking flow'
          : 'App uses pay-per-booking flow (user pays service amount)'
      },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Subscription flow ${enabled ? 'enabled' : 'disabled'}`,
      data: { enabled: setting.value }
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: error.message });
  }
};

module.exports = {
  getAppSetting,
  setAppSetting,
  getAllAppSettings,
  getSalonMode,
  toggleSalonMode,
  getWorkingHours,
  setWorkingHours,
  getSubscriptionFlow,
  toggleSubscriptionFlow
};
