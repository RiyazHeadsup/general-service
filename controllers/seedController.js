const mongoose = require('mongoose');
const Group = require('../models/Group');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Service = require('../models/Service');

class SeedController {

  // POST /importTemplatesToUnit
  // Copies all unassigned services (no unitIds or empty) + all groups/categories into target unit with price=0
  // Also supports sourceUnitId to copy from a specific unit as template
  async importTemplatesToUnit(req, res) {
    try {
      const { targetUnitId, sourceUnitId, groupName } = req.body;
      if (!targetUnitId) {
        return res.status(400).json({ statusCode: 400, error: 'targetUnitId is required' });
      }

      const targetObjId = new mongoose.Types.ObjectId(targetUnitId);
      const stats = { groups: 0, categories: 0, subCategories: 0, services: 0 };

      // Query: either from a source unit or from unassigned template data
      const groupQuery = sourceUnitId
        ? { unitIds: sourceUnitId }
        : { $or: [{ unitIds: null }, { unitIds: { $exists: false } }] };
      // Filter by group name if specified
      if (groupName) groupQuery.name = { $regex: groupName, $options: 'i' };
      const catQuery = sourceUnitId
        ? { unitIds: sourceUnitId }
        : { $or: [{ unitIds: null }, { unitIds: { $exists: false } }, { unitIds: { $size: 0 } }] };
      const subQuery = sourceUnitId
        ? { unitIds: sourceUnitId }
        : { $or: [{ unitIds: null }, { unitIds: { $exists: false } }, { unitIds: { $size: 0 } }] };
      const svcQuery = sourceUnitId
        ? { unitIds: sourceUnitId }
        : { $or: [{ unitIds: null }, { unitIds: { $exists: false } }] };

      // 1. Clone Groups
      const templateGroups = await Group.find(groupQuery).lean();
      const groupMap = {};
      for (const g of templateGroups) {
        const oldId = g._id;
        delete g._id; delete g.__v; delete g.createdAt; delete g.updatedAt;
        g.unitIds = targetObjId;
        const newGroup = await new Group(g).save();
        groupMap[oldId.toString()] = newGroup._id;
        stats.groups++;
      }

      // 2. Clone ALL Categories from source unit
      const templateCategories = await Category.find(catQuery).lean();
      const catMap = {};
      for (const c of templateCategories) {
        const oldId = c._id;
        delete c._id; delete c.__v; delete c.createdAt; delete c.updatedAt;
        c.unitIds = [targetObjId];
        if (c.groupId && groupMap[c.groupId.toString()]) c.groupId = groupMap[c.groupId.toString()];
        // Remap groupUsing array
        if (Array.isArray(c.groupUsing)) {
          c.groupUsing = c.groupUsing.map(gId => groupMap[gId.toString()] || gId);
        } else if (c.groupUsing && groupMap[c.groupUsing.toString()]) {
          c.groupUsing = groupMap[c.groupUsing.toString()];
        }
        const newCat = await new Category(c).save();
        catMap[oldId.toString()] = newCat._id;
        stats.categories++;
      }

      // 3. Clone ALL SubCategories from source unit
      const templateSubs = await SubCategory.find(subQuery).lean();
      const subMap = {};
      for (const s of templateSubs) {
        const oldId = s._id;
        delete s._id; delete s.__v; delete s.createdAt; delete s.updatedAt;
        s.unitIds = [targetObjId];
        if (s.categoryId && catMap[s.categoryId.toString()]) s.categoryId = catMap[s.categoryId.toString()];
        if (Array.isArray(s.groupUsing)) {
          s.groupUsing = s.groupUsing.map(gId => groupMap[gId.toString()] || gId);
        } else if (s.groupUsing && groupMap[s.groupUsing.toString()]) {
          s.groupUsing = groupMap[s.groupUsing.toString()];
        }
        const newSub = await new SubCategory(s).save();
        subMap[oldId.toString()] = newSub._id;
        stats.subCategories++;
      }

      // 4. Clone ALL Services from source unit with price=0
      const templateServices = await Service.find(svcQuery).lean();
      for (const svc of templateServices) {
        delete svc._id; delete svc.__v; delete svc.createdAt; delete svc.updatedAt;
        svc.unitIds = targetObjId;
        svc.price = 0;
        svc.staffIds = [];
        // Remap IDs to new cloned IDs
        if (svc.groupId && groupMap[svc.groupId.toString()]) {
          svc.groupId = groupMap[svc.groupId.toString()];
        } else if (Object.values(groupMap).length > 0) {
          // Service group doesn't match - assign to first imported group
          svc.groupId = Object.values(groupMap)[0];
        }
        if (svc.categoryId && catMap[svc.categoryId.toString()]) svc.categoryId = catMap[svc.categoryId.toString()];
        if (svc.subCategoryId && subMap[svc.subCategoryId.toString()]) svc.subCategoryId = subMap[svc.subCategoryId.toString()];
        await new Service(svc).save();
        stats.services++;
      }

      // Return created group IDs for auto-selection
      const createdGroupIds = Object.values(groupMap);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Imported ${stats.groups} groups, ${stats.categories} categories, ${stats.subCategories} subcategories, ${stats.services} services (price set to 0)`,
        data: { ...stats, createdGroupIds }
      });
    } catch (error) {
      console.error('Import template error:', error);
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  // POST /cloneServicesToUnit
  // Copies services from one unit to another (keeps prices)
  async cloneServicesToUnit(req, res) {
    try {
      const { sourceUnitId, targetUnitId } = req.body;
      if (!sourceUnitId || !targetUnitId) {
        return res.status(400).json({ statusCode: 400, error: 'sourceUnitId and targetUnitId are required' });
      }
      if (sourceUnitId === targetUnitId) {
        return res.status(400).json({ statusCode: 400, error: 'Source and target unit cannot be the same' });
      }

      const targetObjId = new mongoose.Types.ObjectId(targetUnitId);
      const stats = { groups: 0, categories: 0, subCategories: 0, services: 0 };

      const sourceGroups = await Group.find({ unitIds: sourceUnitId }).lean();
      const groupMap = {};
      for (const g of sourceGroups) {
        const oldId = g._id;
        delete g._id; delete g.__v; delete g.createdAt; delete g.updatedAt;
        g.unitIds = targetObjId;
        const newGroup = await new Group(g).save();
        groupMap[oldId.toString()] = newGroup._id;
        stats.groups++;
      }

      const sourceCategories = await Category.find({ unitIds: sourceUnitId }).lean();
      const catMap = {};
      for (const c of sourceCategories) {
        const oldId = c._id;
        delete c._id; delete c.__v; delete c.createdAt; delete c.updatedAt;
        c.unitIds = [targetObjId];
        if (c.groupId && groupMap[c.groupId.toString()]) c.groupId = groupMap[c.groupId.toString()];
        if (c.groupUsing && groupMap[c.groupUsing.toString()]) c.groupUsing = groupMap[c.groupUsing.toString()];
        const newCat = await new Category(c).save();
        catMap[oldId.toString()] = newCat._id;
        stats.categories++;
      }

      const sourceSubs = await SubCategory.find({ unitIds: sourceUnitId }).lean();
      const subMap = {};
      for (const s of sourceSubs) {
        const oldId = s._id;
        delete s._id; delete s.__v; delete s.createdAt; delete s.updatedAt;
        s.unitIds = [targetObjId];
        if (s.categoryId && catMap[s.categoryId.toString()]) s.categoryId = catMap[s.categoryId.toString()];
        if (s.groupUsing && groupMap[s.groupUsing.toString()]) s.groupUsing = groupMap[s.groupUsing.toString()];
        const newSub = await new SubCategory(s).save();
        subMap[oldId.toString()] = newSub._id;
        stats.subCategories++;
      }

      const sourceServices = await Service.find({ unitIds: sourceUnitId }).lean();
      for (const svc of sourceServices) {
        delete svc._id; delete svc.__v; delete svc.createdAt; delete svc.updatedAt;
        svc.unitIds = targetObjId;
        svc.staffIds = [];
        if (svc.groupId && groupMap[svc.groupId.toString()]) svc.groupId = groupMap[svc.groupId.toString()];
        if (svc.categoryId && catMap[svc.categoryId.toString()]) svc.categoryId = catMap[svc.categoryId.toString()];
        if (svc.subCategoryId && subMap[svc.subCategoryId.toString()]) svc.subCategoryId = subMap[svc.subCategoryId.toString()];
        await new Service(svc).save();
        stats.services++;
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Cloned ${stats.groups} groups, ${stats.categories} categories, ${stats.subCategories} subcategories, ${stats.services} services`,
        data: stats
      });
    } catch (error) {
      console.error('Clone error:', error);
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }
}

module.exports = new SeedController();
