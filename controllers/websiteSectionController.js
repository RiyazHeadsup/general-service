const WebsiteSection = require('../models/WebsiteSection');
const { defaultContent } = require('../models/WebsiteSection');

class WebsiteSectionController {

  // ADD a new section
  async addWebsiteSection(req, res) {
    try {
      const { unitIds, type, order, isVisible, content } = req.body;

      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }
      if (!type) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'type is required' });
      }

      // Use provided content, or fall back to defaults for the type
      const finalContent = content || defaultContent[type] || {};

      // Auto-assign order as last if not provided
      let finalOrder = order;
      if (finalOrder === undefined || finalOrder === null) {
        const lastSection = await WebsiteSection.findOne({ unitIds }).sort({ order: -1 });
        finalOrder = lastSection ? lastSection.order + 1 : 0;
      }

      const section = new WebsiteSection({
        unitIds,
        type,
        order: finalOrder,
        isVisible: isVisible !== false,
        content: finalContent
      });

      await section.save();

      res.status(200).json({
        success: true,
        statusCode: 201,
        message: 'Website section created successfully',
        data: section
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // SEARCH sections (admin — all sections including hidden)
  async searchWebsiteSection(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 50,
        sort: req.body.sort || { order: 1 }
      };
      const result = await WebsiteSection.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // UPDATE a section (content, order, isVisible, etc.)
  async updateWebsiteSection(req, res) {
    try {
      const { _id, ...updateData } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section _id is required' });
      }

      const section = await WebsiteSection.findByIdAndUpdate(
        _id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({ success: true, statusCode: 200, message: 'Section updated successfully', data: section });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // DELETE a section
  async deleteWebsiteSection(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section _id is required' });
      }

      const section = await WebsiteSection.findByIdAndDelete(_id);
      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({ success: true, statusCode: 200, message: 'Section deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // TOGGLE visibility
  async toggleWebsiteSectionVisibility(req, res) {
    try {
      const { _id, isVisible } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Section _id is required' });
      }

      const section = await WebsiteSection.findByIdAndUpdate(
        _id,
        { isVisible: isVisible !== false },
        { new: true }
      );

      if (!section) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Section not found' });
      }

      res.json({
        success: true,
        statusCode: 200,
        message: `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`,
        data: section
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // REORDER sections — accepts array of { _id, order }
  async reorderWebsiteSections(req, res) {
    try {
      const { sections } = req.body;
      if (!sections || !Array.isArray(sections)) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'sections array of { _id, order } is required' });
      }

      const updatePromises = sections.map(({ _id, order }) =>
        WebsiteSection.findByIdAndUpdate(_id, { order })
      );
      await Promise.all(updatePromises);

      res.json({ success: true, statusCode: 200, message: 'Sections reordered successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // SEED default sections for a unit (one-time setup from admin)
  async seedDefaultSections(req, res) {
    try {
      const { unitIds } = req.body;
      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }

      // Check if sections already exist
      const existing = await WebsiteSection.countDocuments({ unitIds });
      if (existing > 0) {
        return res.status(400).json({ success: false, statusCode: 400, message: `${existing} sections already exist for this unit. Delete them first to re-seed.` });
      }

      const sectionTypes = ['hero', 'services', 'why_choose_us', 'stats', 'testimonials', 'cta'];
      const sections = sectionTypes.map((type, index) => ({
        unitIds,
        type,
        order: index,
        isVisible: true,
        content: defaultContent[type]
      }));

      const created = await WebsiteSection.insertMany(sections);

      res.json({
        success: true,
        statusCode: 201,
        message: `${created.length} default sections seeded successfully`,
        data: created
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new WebsiteSectionController();
