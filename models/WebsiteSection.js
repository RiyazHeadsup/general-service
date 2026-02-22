const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Default content per section type
const defaultContent = {
  hero: {
    videoUrl: '/video/hero.mp4',
    imageUrl: '',
    badge: 'Welcome to Elevate Salon',
    title: 'Elevate Your Beauty Experience',
    subtitle: 'Discover a world of premium beauty services crafted by expert stylists. Your journey to looking and feeling extraordinary starts here.',
    primaryCta: { text: 'Book Now', link: '/home' },
    secondaryCta: { text: 'Explore Services', link: '#services' }
  },
  services: {
    eyebrow: 'What We Offer',
    title: 'Our Premium Services',
    subtitle: 'Indulge in a wide range of beauty and wellness services designed to make you look stunning and feel confident.',
    items: [
      { title: 'Haircare & Styling', description: 'From trendy cuts to stunning color transformations, our expert stylists create the perfect look for you.', color: '#ec4899' },
      { title: 'Skincare Treatments', description: 'Rejuvenate your skin with our premium facials, peels, and personalized skincare routines.', color: '#f59e0b' },
      { title: 'Professional Makeup', description: 'Look flawless for any occasion with our professional makeup artistry and consultation.', color: '#8b5cf6' },
      { title: 'Nail Art & Care', description: 'Express yourself with stunning nail art, manicures, and pedicures using top-quality products.', color: '#06b6d4' },
      { title: 'Spa & Massage', description: 'Unwind with our luxurious spa treatments and therapeutic massage therapies for total relaxation.', color: '#10b981' },
      { title: 'Bridal Packages', description: 'Make your special day unforgettable with our complete bridal beauty packages and pre-wedding care.', color: '#f43f5e' }
    ]
  },
  why_choose_us: {
    eyebrow: 'Why Elevate',
    title: 'Why Choose Us',
    subtitle: 'We go above and beyond to ensure every visit leaves you feeling beautiful and refreshed.',
    items: [
      { title: 'Expert Stylists', description: 'Our team of certified professionals brings years of experience and ongoing training in the latest trends.' },
      { title: 'Premium Products', description: 'We use only the finest, salon-grade products from globally trusted brands for the best results.' },
      { title: 'Relaxing Ambiance', description: 'Step into a serene, beautifully designed space where you can unwind and enjoy your pampering session.' },
      { title: 'Affordable Prices', description: 'Luxury beauty services at competitive prices. We believe everyone deserves to look and feel amazing.' }
    ]
  },
  stats: {
    items: [
      { label: 'Happy Clients', value: 5000, suffix: '+' },
      { label: 'Expert Stylists', value: 50, suffix: '+' },
      { label: 'Years Experience', value: 12, suffix: '+' },
      { label: 'Services Offered', value: 100, suffix: '+' }
    ]
  },
  testimonials: {
    eyebrow: 'Testimonials',
    title: 'What Our Clients Say',
    subtitle: "Don't just take our word for it. Here's what our amazing clients have to say about their experience.",
    items: [
      { name: 'Priya Sharma', role: 'Regular Client', text: 'Elevate Salon transformed my look completely! The stylists are incredibly talented and the ambiance is so relaxing.', rating: 5 },
      { name: 'Ananya Gupta', role: 'Bridal Client', text: 'My bridal package was absolutely perfect. The team made me feel like a queen on my special day.', rating: 5 },
      { name: 'Rahul Verma', role: 'Monthly Member', text: 'Best salon experience I have ever had. The spa massage was heavenly and the grooming services are top-notch.', rating: 5 }
    ]
  },
  cta: {
    badge: 'Get Started Today',
    title: 'Ready to Transform Your Look?',
    subtitle: 'Book your appointment today and experience the ultimate beauty transformation. Your journey to elegance starts with a single step.',
    primaryCta: { text: 'Book Your Appointment', link: '/home' },
    secondaryCta: { text: 'Contact Us', link: '/contact-us' }
  },
  custom: {
    html: ''
  }
};

const websiteSectionSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  type: {
    type: String,
    enum: ['hero', 'services', 'why_choose_us', 'stats', 'testimonials', 'cta', 'custom'],
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  // Flexible JSON content — structure depends on `type`
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Index for fast sorted fetch per unit
websiteSectionSchema.index({ unitIds: 1, isVisible: 1, order: 1 });

websiteSectionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('WebsiteSection', websiteSectionSchema);
module.exports.defaultContent = defaultContent;
