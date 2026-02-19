const AppSectionClient = require('../models/AppSectionClient');
const SalonChildService = require('../models/SalonChildService');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

class AppSectionClientController {
  // Create a new section
  async addAppSectionClient(req, res) {
    try {
      const { unitIds, projectId, title, slug, description, order, isActive, gender, displayType, serviceType, services, sectionType, categories } = req.body;

      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }
      if (!projectId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'projectId is required' });
      }
      if (!title) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'title is required' });
      }

      // Generate slug from title if not provided
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

      // Check for duplicate slug in same unit and project
      const existing = await AppSectionClient.findOne({ unitIds, projectId, slug: finalSlug });
      if (existing) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section with this slug already exists for this unit and project' });
      }

      const section = new AppSectionClient({
        unitIds,
        projectId,
        title,
        slug: finalSlug,
        description: description || '',
        order: order || 0,
        isActive: isActive !== false,
        gender: gender || 'all',
        displayType: displayType || 'horizontal_scroll',
        serviceType: serviceType || '',
        services: services || [],
        sectionType: sectionType || 'services',
        categories: categories || []
      });

      await section.save();

      res.status(200).json({
        success: true,
        statusCode: 201,
        message: 'Section created successfully',
        data: section
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Search/list sections
  async searchAppSectionClient(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 50,
        sort: req.body.sort || { order: 1, createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'projectId', select: 'name description' },
          { path: 'services.serviceId', select: 'name price img service_time gender' },
          { path: 'categories.categoryId', select: 'name img' },
          { path: 'categories.subCategoryId', select: 'name img' }
        ]
      };

      const result = await AppSectionClient.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Update section
  async updateAppSectionClient(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section ID is required' });
      }

      // If slug is being updated, check for duplicates
      if (req.body.slug) {
        const currentSection = await AppSectionClient.findById(_id);
        const existing = await AppSectionClient.findOne({
          _id: { $ne: _id },
          unitIds: req.body.unitIds || currentSection?.unitIds,
          projectId: req.body.projectId || currentSection?.projectId,
          slug: req.body.slug
        });
        if (existing) {
          return res.status(400).json({ success: false, statusCode: 400, message: 'Section with this slug already exists' });
        }
      }

      const section = await AppSectionClient.findByIdAndUpdate(_id, req.body, { new: true })
        .populate('services.serviceId', 'name price img service_time gender');

      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({ success: true, statusCode: 200, message: 'Section updated successfully', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Delete section
  async deleteAppSectionClient(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section ID is required' });
      }

      const section = await AppSectionClient.findByIdAndDelete(_id);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({ success: true, statusCode: 200, message: 'Section deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Add service to section
  async addServiceToSection(req, res) {
    try {
      const { sectionId, serviceId, order } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sectionId is required' });
      }
      if (!serviceId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'serviceId is required' });
      }

      // Verify service exists
      const service = await SalonChildService.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Service not found' });
      }

      const section = await AppSectionClient.findById(sectionId);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      // Check if service already exists in section
      const existingIndex = section.services.findIndex(s => s.serviceId.toString() === serviceId);
      if (existingIndex !== -1) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Service already exists in this section' });
      }

      // Add service with order
      const newOrder = order !== undefined ? order : section.services.length;
      section.services.push({ serviceId, order: newOrder });
      await section.save();

      // Populate and return
      await section.populate('services.serviceId', 'name price img service_time gender');

      res.json({ success: true, statusCode: 200, message: 'Service added to section', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Remove service from section
  async removeServiceFromSection(req, res) {
    try {
      const { sectionId, serviceId } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sectionId is required' });
      }
      if (!serviceId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'serviceId is required' });
      }

      const section = await AppSectionClient.findById(sectionId);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      // Remove service
      section.services = section.services.filter(s => s.serviceId.toString() !== serviceId);
      await section.save();

      // Populate and return
      await section.populate('services.serviceId', 'name price img service_time gender');

      res.json({ success: true, statusCode: 200, message: 'Service removed from section', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Reorder services within section
  async reorderSectionServices(req, res) {
    try {
      const { sectionId, services } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sectionId is required' });
      }
      if (!services || !Array.isArray(services)) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'services array is required' });
      }

      const section = await AppSectionClient.findById(sectionId);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      // Update order for each service
      // services should be array of { serviceId, order }
      services.forEach(({ serviceId, order }) => {
        const service = section.services.find(s => s.serviceId.toString() === serviceId);
        if (service) {
          service.order = order;
        }
      });

      // Sort services by order
      section.services.sort((a, b) => a.order - b.order);
      await section.save();

      // Populate and return
      await section.populate('services.serviceId', 'name price img service_time gender');

      res.json({ success: true, statusCode: 200, message: 'Services reordered successfully', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Add category to section
  async addCategoryToSection(req, res) {
    try {
      const { sectionId, categoryId, subCategoryId, itemType, order } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sectionId is required' });
      }
      if (!itemType || !['category', 'subcategory'].includes(itemType)) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'itemType must be "category" or "subcategory"' });
      }
      if (itemType === 'category' && !categoryId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'categoryId is required for category type' });
      }
      if (itemType === 'subcategory' && !subCategoryId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'subCategoryId is required for subcategory type' });
      }

      // Verify category/subcategory exists
      if (itemType === 'category') {
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).json({ success: false, statusCode: 404, message: 'Category not found' });
        }
      } else {
        const subCategory = await SubCategory.findById(subCategoryId);
        if (!subCategory) {
          return res.status(404).json({ success: false, statusCode: 404, message: 'SubCategory not found' });
        }
      }

      const section = await AppSectionClient.findById(sectionId);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      // Check if already exists in section
      const existingIndex = section.categories.findIndex(c => {
        if (itemType === 'category') {
          return c.categoryId?.toString() === categoryId && c.itemType === 'category';
        }
        return c.subCategoryId?.toString() === subCategoryId && c.itemType === 'subcategory';
      });

      if (existingIndex !== -1) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'This item already exists in the section' });
      }

      // Add category with order
      const newOrder = order !== undefined ? order : section.categories.length;
      const categoryItem = {
        itemType,
        order: newOrder
      };
      if (itemType === 'category') {
        categoryItem.categoryId = categoryId;
      } else {
        categoryItem.subCategoryId = subCategoryId;
        if (categoryId) categoryItem.categoryId = categoryId;
      }

      section.categories.push(categoryItem);
      await section.save();

      // Populate and return
      await section.populate([
        { path: 'categories.categoryId', select: 'name img' },
        { path: 'categories.subCategoryId', select: 'name img' }
      ]);

      res.json({ success: true, statusCode: 200, message: 'Category added to section', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Remove category from section
  async removeCategoryFromSection(req, res) {
    try {
      const { sectionId, categoryId, subCategoryId, itemType } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sectionId is required' });
      }
      if (!itemType || !['category', 'subcategory'].includes(itemType)) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'itemType must be "category" or "subcategory"' });
      }

      const section = await AppSectionClient.findById(sectionId);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      // Remove category
      section.categories = section.categories.filter(c => {
        if (itemType === 'category') {
          return !(c.categoryId?.toString() === categoryId && c.itemType === 'category');
        }
        return !(c.subCategoryId?.toString() === subCategoryId && c.itemType === 'subcategory');
      });

      await section.save();

      // Populate and return
      await section.populate([
        { path: 'categories.categoryId', select: 'name img' },
        { path: 'categories.subCategoryId', select: 'name img' }
      ]);

      res.json({ success: true, statusCode: 200, message: 'Category removed from section', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Reorder sections
  async reorderSections(req, res) {
    try {
      const { sections } = req.body;

      if (!sections || !Array.isArray(sections)) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sections array is required' });
      }

      // Update order for each section
      // sections should be array of { _id, order }
      const updatePromises = sections.map(({ _id, order }) =>
        AppSectionClient.findByIdAndUpdate(_id, { order })
      );

      await Promise.all(updatePromises);

      res.json({ success: true, statusCode: 200, message: 'Sections reordered successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Toggle section visibility
  async toggleSectionVisibility(req, res) {
    try {
      const { _id, isActive } = req.body;

      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section ID is required' });
      }

      const section = await AppSectionClient.findByIdAndUpdate(
        _id,
        { isActive: isActive !== false },
        { new: true }
      );

      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({ success: true, statusCode: 200, message: `Section ${section.isActive ? 'activated' : 'deactivated'}`, data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // CLIENT API: Get active sections with populated services
  async getClientSections(req, res) {
    try {
      const { unitId, gender } = req.body;

      if (!unitId) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitId is required' });
      }

      // Build query for active sections
      const query = {
        unitIds: unitId,
        isActive: true
      };

      // Filter by gender if provided
      if (gender && gender !== 'all') {
        query.$or = [
          { gender: 'all' },
          { gender: gender }
        ];
      }

      const sections = await AppSectionClient.find(query)
        .sort({ order: 1 })
        .populate({
          path: 'services.serviceId',
          select: 'name price member_price img service_time gender childDesc'
        })
        .lean();

      // Transform data for client
      const transformedSections = sections.map(section => ({
        id: section._id,
        title: section.title,
        slug: section.slug,
        description: section.description,
        displayType: section.displayType,
        gender: section.gender,
        order: section.order,
        services: section.services
          .filter(s => s.serviceId) // Filter out null references
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

      res.json({ success: true, statusCode: 200, data: { sections: transformedSections } });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new AppSectionClientController();
