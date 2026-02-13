const SalonParent = require('../models/SalonParent');
const SalonChildService = require('../models/SalonChildService');
const AtHomeParent = require('../models/AtHomeParent');
const AtHomeChildService = require('../models/AtHomeChildService');
const General = require('../models/General');
const AppBanner = require('../models/AppBanner');
const AppSectionClient = require('../models/AppSectionClient');

class AppController {
  async getAppConfig(req, res) {
    try {
      const configEntries = await General.find({ usedBy: 'app', isActive: true });

      const configMap = {};
      configEntries.forEach(entry => {
        configMap[entry.label] = entry.value;
      });

      const data = {
        defaultGender: configMap.defaultGender || 'female',
        serviceModes: [
          { key: 'in_salon', label: 'In Salon', enabled: true },
          { key: 'at_home', label: 'At Home', enabled: false }
        ],
        maintenance: configMap.maintenance === 'true' ? true : false
      };

      res.status(200).json({ success: true, statusCode: 200, data });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch app config' });
    }
  }

  async getHome(req, res) {
    try {
      const { unitId, gender, serviceType } = req.body;

      if (!unitId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitId is required' });
      }

      // Select the correct models based on serviceType
      const isAtHome = serviceType === 'athome';
      const ParentModel = isAtHome ? AtHomeParent : SalonParent;
      const ChildModel = isAtHome ? AtHomeChildService : SalonChildService;

      const parents = await ParentModel.find({ unitIds: unitId }).lean();

      let categories = [];

      for (const parent of parents) {
        const childQuery = { parentId: parent._id, unitIds: unitId };
        if (gender) {
          // Include services with matching gender OR no gender set (backwards compatibility)
          childQuery.gender = { $in: [gender, null] };
        }

        const childCount = await ChildModel.countDocuments(childQuery);

        if (childCount > 0) {
          categories.push({
            id: parent._id,
            name: parent.name,
            image: parent.img || null,
            description: parent.parentDesc || null
          });
        }
      }

      const now = new Date();
      const bannerQuery = {
        unitIds: unitId,
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: null, endDate: null },
              { startDate: { $lte: now }, endDate: null },
              { startDate: null, endDate: { $gte: now } },
              { startDate: { $lte: now }, endDate: { $gte: now } }
            ]
          }
        ]
      };

      // Filter banners by gender
      if (gender && gender !== 'all') {
        bannerQuery.$and.push({
          $or: [
            { gender: 'all' },
            { gender: gender },
            { gender: { $exists: false } } // Backwards compatibility for banners without gender
          ]
        });
      }

      const activeBanners = await AppBanner.find(bannerQuery).sort({ order: 1 }).lean();

      const banners = activeBanners.map(b => ({
        id: b._id,
        title: b.title,
        imageUrl: b.imageUrl,
        description: b.description || null,
        order: b.order,
        gender: b.gender || 'all'
      }));

      // Fetch active sections with services
      const sectionQuery = {
        unitIds: unitId,
        isActive: true
      };

      // Filter sections by serviceType
      // Legacy sections (created before serviceType was added) don't have this field — treat them as 'salon'
      if (serviceType === 'salon') {
        sectionQuery.serviceType = { $in: ['salon', null] };
      } else if (serviceType) {
        sectionQuery.serviceType = serviceType;
      }

      if (gender && gender !== 'all') {
        sectionQuery.$or = [
          { gender: 'all' },
          { gender: gender }
        ];
      }

      // Populate from the correct model based on serviceType
      const populateModel = isAtHome ? 'AtHomeChildService' : 'SalonChildService';

      const activeSections = await AppSectionClient.find(sectionQuery)
        .sort({ order: 1 })
        .populate({
          path: 'services.serviceId',
          model: populateModel,
          select: 'name price member_price img service_time gender childDesc'
        })
        .lean();

      const sections = activeSections.map(section => ({
        id: section._id,
        title: section.title,
        slug: section.slug,
        description: section.description,
        displayType: section.displayType,
        gender: section.gender,
        order: section.order,
        services: section.services
          .filter(s => s.serviceId)
          .sort((a, b) => a.order - b.order)
          .map(s => ({
            id: s.serviceId._id,
            name: s.serviceId.name,
            price: s.serviceId.price,
            memberPrice: s.serviceId.member_price,
            image: s.serviceId.img,
            duration: s.serviceId.service_time,
            gender: s.serviceId.gender,
            description: s.serviceId.childDesc
          }))
      }));

      res.status(200).json({ success: true, statusCode: 200, data: { categories, banners, sections } });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch home data' });
    }
  }

  async getParentServiceDetails(req, res) {
    try {
      const { parentId, unitId, gender } = req.body;

      if (!parentId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'parentId is required' });
      }

      if (!unitId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitId is required' });
      }

      const salonParent = await SalonParent.findById(parentId).lean();
      if (!salonParent) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Parent service not found' });
      }

      const childQuery = { parentId, unitIds: unitId };
      if (gender) {
        // Include services with matching gender OR no gender set (backwards compatibility)
        childQuery.gender = { $in: [gender, null] };
      }

      const childServices = await SalonChildService.find(childQuery).lean();

      const parent = {
        id: salonParent._id,
        name: salonParent.name,
        image: salonParent.img || null,
        description: salonParent.parentDesc || null
      };

      const services = childServices.map(child => ({
        id: child._id,
        name: child.name,
        price: child.price,
        memberPrice: child.member_price,
        duration: child.service_time,
        image: child.img || null,
        description: child.childDesc || null,
        gender: child.gender || null
      }));

      res.status(200).json({ success: true, statusCode: 200, data: { parent, services } });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch parent service details' });
    }
  }
  async getAppBanners(req, res) {
    try {
      const { unitId } = req.body;

      if (!unitId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitId is required' });
      }

      const now = new Date();
      const activeBanners = await AppBanner.find({
        unitIds: unitId,
        isActive: true,
        $or: [
          { startDate: null, endDate: null },
          { startDate: { $lte: now }, endDate: null },
          { startDate: null, endDate: { $gte: now } },
          { startDate: { $lte: now }, endDate: { $gte: now } }
        ]
      }).sort({ order: 1 }).lean();

      const banners = activeBanners.map(b => ({
        id: b._id,
        title: b.title,
        imageUrl: b.imageUrl,
        description: b.description || null,
        order: b.order
      }));

      res.status(200).json({ success: true, statusCode: 200, data: { banners } });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch banners' });
    }
  }
}

module.exports = new AppController();
