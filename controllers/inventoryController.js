const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Service = require('../models/Service');
const Product = require('../models/Product');

class InventoryController {
  async createInventory(req, res) {
    try {
      const { productId, qty, unitIds, createdBy } = req.body;

      // Check if inventory already exists for this product and unit (including inactive)
      const existingInventory = await Inventory.findOne({ productId, unitIds });

      if (existingInventory) {
        const previousQty = existingInventory.qty || 0;
        const newQty = previousQty + (qty || 0);
        const wasInactive = existingInventory.isActive === false;

        // Update existing inventory - add to current qty and reactivate if inactive
        existingInventory.qty = newQty;
        existingInventory.isActive = true;
        await existingInventory.save();

        // If inventory was inactive, reactivate product and associated services
        if (wasInactive) {
          // Reactivate product
          await Product.findByIdAndUpdate(productId, { isActive: true });

          // Reactivate associated services
          await Service.updateMany(
            { productId: productId },
            { isActive: true }
          );
        }

        // Create transaction record
        await InventoryTransaction.create({
          inventoryId: existingInventory._id,
          productId,
          unitIds,
          transactionType: 'IN',
          qty: qty || 0,
          previousQty,
          newQty,
          reason: wasInactive ? 'Inventory reactivated and stock added' : 'Stock added to existing inventory',
          referenceType: 'MANUAL',
          createdBy
        });

        res.status(200).json({
          success: true,
          message: wasInactive ? "Inventory reactivated successfully" : "Inventory updated successfully",
          statusCode: 200,
          data: existingInventory
        });
      } else {
        // Create new inventory
        const inventory = new Inventory(req.body);
        await inventory.save();

        // Create transaction record
        await InventoryTransaction.create({
          inventoryId: inventory._id,
          productId,
          unitIds,
          transactionType: 'IN',
          qty: qty || 0,
          previousQty: 0,
          newQty: qty || 0,
          reason: 'Initial inventory created',
          referenceType: 'MANUAL',
          createdBy
        });

        res.status(200).json({
          success: true,
          message: "Inventory created successfully",
          statusCode: 201,
          data: inventory
        });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchInventory(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'productId', select: 'productName brand productType' },
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const inventories = await Inventory.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: inventories });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateInventory(req, res) {
    try {
      const { _id, qty, createdBy } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Inventory ID is required' });
      }

      // Get current inventory for transaction record
      const currentInventory = await Inventory.findById(_id);
      if (!currentInventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      const previousQty = currentInventory.qty || 0;
      const newQty = qty || 0;
      const qtyDiff = newQty - previousQty;

      const inventory = await Inventory.findByIdAndUpdate(_id, req.body, { new: true });

      // Create transaction record if qty changed
      if (qtyDiff !== 0) {
        await InventoryTransaction.create({
          inventoryId: inventory._id,
          productId: inventory.productId,
          unitIds: inventory.unitIds,
          transactionType: qtyDiff > 0 ? 'IN' : 'OUT',
          qty: Math.abs(qtyDiff),
          previousQty,
          newQty,
          reason: 'Inventory manually updated',
          referenceType: 'MANUAL',
          createdBy
        });
      }

      res.json({ statusCode: 200, success: true, data: inventory });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteInventory(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Inventory ID is required' });
      }
      const inventory = await Inventory.findByIdAndRemove(_id);
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }
      res.json({ statusCode: 200, success: true, message: 'Inventory deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InventoryController();
