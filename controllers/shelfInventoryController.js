const ShelfInventory = require('../models/ShelfInventory');
const Warehouse = require('../models/Warehouse');
const ShelfTransfer = require('../models/ShelfTransfer');
const ShelfDashboard = require('../models/ShelfDashboard');
const Product = require('../models/Product');
const LiveStockDashboard = require('../models/LiveStockDashboard');

class ShelfInventoryController {
  async createShelfInventory(req, res) {
    try {
      const shelfInventory = new ShelfInventory(req.body);
      await shelfInventory.save();
      res.status(200).json({
        success: true,
        message: "shelf inventory created successfully",
        statusCode: 201,
        data: shelfInventory
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchShelfInventory(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'warehouseId', select: 'warehouseName address' },
          { path: 'productId', select: 'productName brand' },
          { path: 'unitId', select: 'unitName unitCode' }
        ]
      };
      const shelfInventories = await ShelfInventory.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: shelfInventories });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateShelfInventory(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfInventory ID is required' });
      }
      
      const shelfInventory = await ShelfInventory.findByIdAndUpdate(_id, req.body, { new: true });
      if (!shelfInventory) {
        return res.status(404).json({ error: 'ShelfInventory not found' });
      }
      res.json({ statusCode: 200, data: shelfInventory });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteShelfInventory(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfInventory ID is required' });
      }
      const shelfInventory = await ShelfInventory.findByIdAndRemove(_id);
      if (!shelfInventory) {
        return res.status(404).json({ error: 'ShelfInventory not found' });
      }
      res.json({ statusCode: 200, message: 'ShelfInventory deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async transferFromWarehouseToShelf(req, res) {
    try {
      const { 
        productId, 
        unitId, 
        shelfType, 
        quantity, 
        createdBy, 
        reason, 
        notes 
      } = req.body;

      // Validate required fields
      if (!productId || !unitId || !shelfType || !quantity || !createdBy) {
        return res.status(400).json({ 
          error: 'productId, unitId, shelfType, quantity, and createdBy are required' 
        });
      }

      // Validate shelf type
      if (!['professional', 'retail'].includes(shelfType)) {
        return res.status(400).json({ 
          error: 'shelfType must be either "professional" or "retail"' 
        });
      }

      // Validate quantity
      if (quantity <= 0) {
        return res.status(400).json({ 
          error: 'quantity must be greater than 0' 
        });
      }

      // Find warehouse inventory
      const warehouseInventory = await Warehouse.findOne({ productId, unitId });
      if (!warehouseInventory) {
        return res.status(404).json({ 
          error: 'Product not found in warehouse for this unit' 
        });
      }

      // Check if warehouse has sufficient quantity
      if (warehouseInventory.quantity < quantity) {
        return res.status(400).json({ 
          error: `Insufficient quantity in warehouse. Available: ${warehouseInventory.quantity}, Requested: ${quantity}` 
        });
      }

      // Find or create shelf inventory
      let shelfInventory = await ShelfInventory.findOne({ 
        productId, 
        unitId, 
        shelfType 
      });

      const warehouseQuantityBefore = warehouseInventory.quantity;
      const shelfQuantityBefore = shelfInventory ? shelfInventory.quantity : 0;

      // Update warehouse inventory (reduce quantity)
      warehouseInventory.quantity -= quantity;
      await warehouseInventory.save();

      // Update or create shelf inventory (add quantity)
      if (shelfInventory) {
        shelfInventory.quantity += quantity;
        await shelfInventory.save();
      } else {
        shelfInventory = new ShelfInventory({
          warehouseId: warehouseInventory._id,
          productId,
          unitId,
          shelfType,
          quantity,
          isActive: true
        });
        await shelfInventory.save();
      }

      // Create transfer record
      const transferRecord = new ShelfTransfer({
        warehouseId: warehouseInventory._id,
        productId,
        unitId,
        transferType: 'warehouse_to_shelf',
        fromLocation: 'warehouse',
        toLocation: shelfType,
        quantity,
        quantityBefore: {
          from: warehouseQuantityBefore,
          to: shelfQuantityBefore
        },
        quantityAfter: {
          from: warehouseInventory.quantity,
          to: shelfInventory.quantity
        },
        reason,
        transferDate: Date.now(),
        createdBy,
        notes
      });

      await transferRecord.save();

      // Update dashboard entry
      await updateDashboardForTransfer(
        unitId, 
        productId, 
        'warehouse', 
        shelfType, 
        quantity
      );

      // Update LiveStockDashboard for warehouse changes
      await updateLiveStockDashboard(unitId, quantity);

      res.status(200).json({
        success: true,
        message: "Transfer from warehouse to shelf completed successfully",
        statusCode: 200,
        data: {
          transferRecord,
          warehouseInventory: {
            id: warehouseInventory._id,
            quantityBefore: warehouseQuantityBefore,
            quantityAfter: warehouseInventory.quantity
          },
          shelfInventory: {
            id: shelfInventory._id,
            quantityBefore: shelfQuantityBefore,
            quantityAfter: shelfInventory.quantity
          }
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

async function updateDashboardForTransfer(unitId, productId, fromLocation, toLocation, quantity) {
    try {
      console.log('Starting dashboard update with params:', { unitId, productId, fromLocation, toLocation, quantity });
      
      const today = new Date();
      const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      
      console.log('Today timestamp:', todayTimestamp);

      // Get product details for value calculations
      const product = await Product.findById(productId);
      if (!product) {
        console.log('Product not found for ID:', productId);
        return;
      }
      
      console.log('Product found:', product.productName);

      // Find or create today's dashboard entry
      let dashboard = await ShelfDashboard.findOne({
        date: todayTimestamp,
        unitId: unitId
      });

      console.log('Dashboard found:', dashboard ? 'Yes' : 'No');

      if (!dashboard) {
        console.log('Creating new dashboard entry');
        dashboard = new ShelfDashboard({
          date: todayTimestamp,
          unitId: unitId,
          warehouseSummary: { totalProducts: 0, totalQuantity: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 },
          professionalShelf: { totalProducts: 0, totalQuantity: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0, quantityUsed: 0, valueUsed: 0 },
          retailShelf: { totalProducts: 0, totalQuantity: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0, quantitySold: 0, valueSold: 0, revenue: 0 },
          transferActivity: {
            warehouseToProfessional: { count: 0, quantity: 0 },
            warehouseToRetail: { count: 0, quantity: 0 },
            professionalToWarehouse: { count: 0, quantity: 0 },
            retailToWarehouse: { count: 0, quantity: 0 },
            professionalToRetail: { count: 0, quantity: 0 },
            retailToProfessional: { count: 0, quantity: 0 }
          },
          topProfessionalProducts: [],
          topRetailProducts: [],
          lowStockAlerts: []
        });
      }

      console.log('Transfer direction:', fromLocation, '->', toLocation);

      // Update transfer activity based on transfer direction
      if (fromLocation === 'warehouse' && toLocation === 'professional') {
        dashboard.transferActivity.warehouseToProfessional.count += 1;
        dashboard.transferActivity.warehouseToProfessional.quantity += quantity;
        console.log('Updated warehouseToProfessional');
      } else if (fromLocation === 'warehouse' && toLocation === 'retail') {
        dashboard.transferActivity.warehouseToRetail.count += 1;
        dashboard.transferActivity.warehouseToRetail.quantity += quantity;
        console.log('Updated warehouseToRetail');
      } else if (fromLocation === 'professional' && toLocation === 'warehouse') {
        dashboard.transferActivity.professionalToWarehouse.count += 1;
        dashboard.transferActivity.professionalToWarehouse.quantity += quantity;
        console.log('Updated professionalToWarehouse');
      } else if (fromLocation === 'retail' && toLocation === 'warehouse') {
        dashboard.transferActivity.retailToWarehouse.count += 1;
        dashboard.transferActivity.retailToWarehouse.quantity += quantity;
        console.log('Updated retailToWarehouse');
      } else if (fromLocation === 'professional' && toLocation === 'retail') {
        dashboard.transferActivity.professionalToRetail.count += 1;
        dashboard.transferActivity.professionalToRetail.quantity += quantity;
        console.log('Updated professionalToRetail');
      } else if (fromLocation === 'retail' && toLocation === 'professional') {
        dashboard.transferActivity.retailToProfessional.count += 1;
        dashboard.transferActivity.retailToProfessional.quantity += quantity;
        console.log('Updated retailToProfessional');
      } else {
        console.log('No matching transfer direction found');
      }

      // Update summary values based on current inventory
      await updateDashboardSummaries(dashboard, unitId);
      
      console.log('Dashboard transfer activity before save:', dashboard.transferActivity);
      
      const savedDashboard = await dashboard.save();
      console.log('Dashboard saved successfully with ID:', savedDashboard._id);
      
    } catch (error) {
      console.error('Error updating dashboard for transfer:', error);
      console.error('Error stack:', error.stack);
    }
}

async function updateDashboardSummaries(dashboard, unitId) {
  try {
    console.log('Updating dashboard summaries for unitId:', unitId);
    
    // Get all warehouse inventory for this unit
    const warehouseInventories = await Warehouse.find({ unitId }).populate('productId');
    console.log('Found warehouse inventories:', warehouseInventories.length);
    
    // Get all shelf inventories for this unit
    const professionalShelfInventories = await ShelfInventory.find({ 
      unitId, 
      shelfType: 'professional' 
    }).populate('productId');
    
    const retailShelfInventories = await ShelfInventory.find({ 
      unitId, 
      shelfType: 'retail' 
    }).populate('productId');
    
    console.log('Found professional shelf inventories:', professionalShelfInventories.length);
    console.log('Found retail shelf inventories:', retailShelfInventories.length);

    // Calculate warehouse summary
    let warehouseTotalProducts = 0;
    let warehouseTotalQuantity = 0;
    let warehouseTotalValue = 0;
    let warehouseLowStock = 0;
    let warehouseOutOfStock = 0;

    warehouseInventories.forEach(inv => {
      if (inv.productId) {
        warehouseTotalProducts += 1;
        warehouseTotalQuantity += inv.quantity || 0;
        warehouseTotalValue += (inv.quantity || 0) * (inv.productId.costPrice || 0);
        
        if (inv.quantity === 0) {
          warehouseOutOfStock += 1;
        } else if (inv.quantity <= (inv.quantityAlert || 0)) {
          warehouseLowStock += 1;
        }
      }
    });

    // Calculate professional shelf summary
    let professionalTotalProducts = 0;
    let professionalTotalQuantity = 0;
    let professionalTotalValue = 0;
    let professionalLowStock = 0;
    let professionalOutOfStock = 0;

    professionalShelfInventories.forEach(inv => {
      if (inv.productId) {
        professionalTotalProducts += 1;
        professionalTotalQuantity += inv.quantity || 0;
        professionalTotalValue += (inv.quantity || 0) * (inv.productId.costPrice || 0);
        
        if (inv.quantity === 0) {
          professionalOutOfStock += 1;
        } else if (inv.quantity <= (inv.quantityAlert || 0)) {
          professionalLowStock += 1;
        }
      }
    });

    // Calculate retail shelf summary
    let retailTotalProducts = 0;
    let retailTotalQuantity = 0;
    let retailTotalValue = 0;
    let retailLowStock = 0;
    let retailOutOfStock = 0;

    retailShelfInventories.forEach(inv => {
      if (inv.productId) {
        retailTotalProducts += 1;
        retailTotalQuantity += inv.quantity || 0;
        retailTotalValue += (inv.quantity || 0) * (inv.productId.costPrice || 0);
        
        if (inv.quantity === 0) {
          retailOutOfStock += 1;
        } else if (inv.quantity <= (inv.quantityAlert || 0)) {
          retailLowStock += 1;
        }
      }
    });

    // Update dashboard summaries
    dashboard.warehouseSummary.totalProducts = warehouseTotalProducts;
    dashboard.warehouseSummary.totalQuantity = warehouseTotalQuantity;
    dashboard.warehouseSummary.totalValue = warehouseTotalValue;
    dashboard.warehouseSummary.lowStockProducts = warehouseLowStock;
    dashboard.warehouseSummary.outOfStockProducts = warehouseOutOfStock;

    dashboard.professionalShelf.totalProducts = professionalTotalProducts;
    dashboard.professionalShelf.totalQuantity = professionalTotalQuantity;
    dashboard.professionalShelf.totalValue = professionalTotalValue;
    dashboard.professionalShelf.lowStockProducts = professionalLowStock;
    dashboard.professionalShelf.outOfStockProducts = professionalOutOfStock;

    dashboard.retailShelf.totalProducts = retailTotalProducts;
    dashboard.retailShelf.totalQuantity = retailTotalQuantity;
    dashboard.retailShelf.totalValue = retailTotalValue;
    dashboard.retailShelf.lowStockProducts = retailLowStock;
    dashboard.retailShelf.outOfStockProducts = retailOutOfStock;

    // Update low stock alerts
    const lowStockAlerts = [];
    
    // Check warehouse for low stock
    warehouseInventories.forEach(inv => {
      if (inv.productId && inv.quantity <= (inv.quantityAlert || 0) && inv.quantity > 0) {
        lowStockAlerts.push({
          productId: inv.productId._id,
          productName: inv.productId.productName,
          location: 'warehouse',
          currentQuantity: inv.quantity,
          alertQuantity: inv.quantityAlert || 0
        });
      }
    });
    
    // Check professional shelf for low stock
    professionalShelfInventories.forEach(inv => {
      if (inv.productId && inv.quantity <= (inv.quantityAlert || 0) && inv.quantity > 0) {
        lowStockAlerts.push({
          productId: inv.productId._id,
          productName: inv.productId.productName,
          location: 'professional',
          currentQuantity: inv.quantity,
          alertQuantity: inv.quantityAlert || 0
        });
      }
    });
    
    // Check retail shelf for low stock
    retailShelfInventories.forEach(inv => {
      if (inv.productId && inv.quantity <= (inv.quantityAlert || 0) && inv.quantity > 0) {
        lowStockAlerts.push({
          productId: inv.productId._id,
          productName: inv.productId.productName,
          location: 'retail',
          currentQuantity: inv.quantity,
          alertQuantity: inv.quantityAlert || 0
        });
      }
    });

    // Update dashboard low stock alerts
    dashboard.lowStockAlerts = lowStockAlerts;

    console.log('Updated summaries:', {
      warehouse: {
        totalProducts: warehouseTotalProducts,
        totalQuantity: warehouseTotalQuantity,
        totalValue: warehouseTotalValue
      },
      professional: {
        totalProducts: professionalTotalProducts,
        totalQuantity: professionalTotalQuantity,
        totalValue: professionalTotalValue
      },
      retail: {
        totalProducts: retailTotalProducts,
        totalQuantity: retailTotalQuantity,
        totalValue: retailTotalValue
      },
      lowStockAlerts: lowStockAlerts.length
    });

  } catch (error) {
    console.error('Error updating dashboard summaries:', error);
  }
}

async function updateLiveStockDashboard(unitId, quantity) {
  try {
    console.log('Updating LiveStockDashboard for unitId:', unitId);
    
    const today = new Date();
    const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    // Find or create today's LiveStockDashboard entry
    let liveStockDashboard = await LiveStockDashboard.findOne({
      date: todayTimestamp,
      unitId: unitId
    });

    if (!liveStockDashboard) {
      console.log('Creating new LiveStockDashboard entry');
      liveStockDashboard = new LiveStockDashboard({
        date: todayTimestamp,
        unitId: unitId,
        totalProducts: 0,
        totalStockValue: 0,
        totalCostValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        stockIn: 0,
        stockOut: 0,
        adjustments: 0,
        topProducts: []
      });
    }

    // Update stockOut since we're transferring from warehouse (reducing warehouse stock)
    liveStockDashboard.stockOut += quantity;

    // Recalculate warehouse totals
    const warehouseInventories = await Warehouse.find({ unitId }).populate('productId');
    
    let totalProducts = 0;
    let totalStockValue = 0;
    let totalCostValue = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    warehouseInventories.forEach(inv => {
      if (inv.productId) {
        totalProducts += 1;
        const stockValue = (inv.quantity || 0) * (inv.productId.sellPrice || 0);
        const costValue = (inv.quantity || 0) * (inv.productId.costPrice || 0);
        
        totalStockValue += stockValue;
        totalCostValue += costValue;
        
        if (inv.quantity === 0) {
          outOfStockProducts += 1;
        } else if (inv.quantity <= (inv.quantityAlert || 0)) {
          lowStockProducts += 1;
        }
      }
    });

    // Update dashboard values
    liveStockDashboard.totalProducts = totalProducts;
    liveStockDashboard.totalStockValue = totalStockValue;
    liveStockDashboard.totalCostValue = totalCostValue;
    liveStockDashboard.lowStockProducts = lowStockProducts;
    liveStockDashboard.outOfStockProducts = outOfStockProducts;

    await liveStockDashboard.save();
    
    console.log('LiveStockDashboard updated successfully:', {
      totalProducts,
      totalStockValue,
      totalCostValue,
      stockOut: liveStockDashboard.stockOut
    });

  } catch (error) {
    console.error('Error updating LiveStockDashboard:', error);
  }
}

module.exports = new ShelfInventoryController();