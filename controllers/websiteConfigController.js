const WebsiteConfig = require('../models/WebsiteConfig');
const WebsiteSection = require('../models/WebsiteSection');
const { defaultContent } = require('../models/WebsiteSection');

class WebsiteConfigController {

  // GET config for a unit — auto-creates default if not exists
  async getWebsiteConfig(req, res) {
    try {
      const { unitIds } = req.body;
      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }

      let config = await WebsiteConfig.findOne({ unitIds });

      if (!config) {
        config = await WebsiteConfig.create({ unitIds });
      }

      res.json({ success: true, statusCode: 200, data: config });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // UPDATE config (upsert)
  async updateWebsiteConfig(req, res) {
    try {
      const { unitIds, ...updateData } = req.body;
      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }

      const config = await WebsiteConfig.findOneAndUpdate(
        { unitIds },
        { $set: updateData },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      res.json({ success: true, statusCode: 200, message: 'Website configuration updated successfully', data: config });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // PUBLIC: Get full website data (config + visible sections) in one call
  async getWebsiteData(req, res) {
    try {
      const { unitId } = req.body;
      if (!unitId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitId is required' });
      }

      // Fetch config and sections in parallel
      const [config, sections] = await Promise.all([
        WebsiteConfig.findOne({ unitIds: unitId }).lean(),
        WebsiteSection.find({ unitIds: unitId, isVisible: true })
          .sort({ order: 1 })
          .lean()
      ]);

      // If no config exists yet, return defaults (don't auto-create on public endpoint)
      const finalConfig = config || {
        themeColor: '#000000',
        accentColor: '#00C896',
        logoUrl: '',
        logoUrlDark: '',
        faviconUrl: '',
        seo: { title: 'Elevate Salon & Spa', description: 'Premium beauty and wellness services', keywords: 'salon, spa, beauty' },
        header: { navLinks: [
          { label: 'Home', href: '#hero', order: 0 },
          { label: 'Services', href: '#services', order: 1 },
          { label: 'About Us', href: '#why-choose-us', order: 2 },
          { label: 'Contact Us', href: '#contact-cta', order: 3 }
        ]},
        footer: { address: '', phone: '', email: '', hours: 'Mon - Sat: 9:00 AM - 8:00 PM', socialLinks: [], copyrightText: 'Elevate Salon. All rights reserved.' },
        maintenanceMode: { enabled: false, message: '' }
      };

      // If no sections exist yet, return hardcoded defaults so site doesn't break
      const finalSections = sections.length > 0 ? sections : [
        { type: 'hero', order: 0, isVisible: true, content: defaultContent.hero },
        { type: 'services', order: 1, isVisible: true, content: defaultContent.services },
        { type: 'why_choose_us', order: 2, isVisible: true, content: defaultContent.why_choose_us },
        { type: 'stats', order: 3, isVisible: true, content: defaultContent.stats },
        { type: 'testimonials', order: 4, isVisible: true, content: defaultContent.testimonials },
        { type: 'cta', order: 5, isVisible: true, content: defaultContent.cta }
      ];

      res.json({
        success: true,
        statusCode: 200,
        data: { config: finalConfig, sections: finalSections }
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new WebsiteConfigController();
