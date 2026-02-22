const mongoose = require('mongoose');

const navLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  href: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 }
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin', 'whatsapp'],
    required: true
  },
  url: { type: String, trim: true, default: '' }
}, { _id: false });

const websiteConfigSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    unique: true
  },

  // Theme
  themeColor: { type: String, default: '#000000' },
  accentColor: { type: String, default: '#00C896' },

  // Logos & Favicon
  logoUrl: { type: String, default: '' },        // light (used on dark bg)
  logoUrlDark: { type: String, default: '' },     // dark (used on light bg)
  faviconUrl: { type: String, default: '' },

  // SEO
  seo: {
    title: { type: String, default: 'Elevate Salon & Spa' },
    description: { type: String, default: 'Premium beauty and wellness services' },
    keywords: { type: String, default: 'salon, spa, beauty, wellness' }
  },

  // Header
  header: {
    navLinks: { type: [navLinkSchema], default: [
      { label: 'Home', href: '#hero', order: 0 },
      { label: 'Services', href: '#services', order: 1 },
      { label: 'About Us', href: '#why-choose-us', order: 2 },
      { label: 'Contact Us', href: '#contact-cta', order: 3 }
    ]}
  },

  // Footer
  footer: {
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    hours: { type: String, default: 'Mon - Sat: 9:00 AM - 8:00 PM' },
    socialLinks: { type: [socialLinkSchema], default: [
      { platform: 'instagram', url: '' },
      { platform: 'facebook', url: '' },
      { platform: 'twitter', url: '' },
      { platform: 'youtube', url: '' }
    ]},
    copyrightText: { type: String, default: 'Elevate Salon. All rights reserved.' }
  },

  // Maintenance
  maintenanceMode: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'We are currently under maintenance. Please check back soon.' }
  }

}, { timestamps: true });

module.exports = mongoose.model('WebsiteConfig', websiteConfigSchema);
