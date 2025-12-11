require('dotenv').config();
const express = require('express');
const DatabaseConfig = require('./config/database');
const ConsulConfig = require('./config/consul');
const unitRoutes = require('./routes/unitRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const generalRoutes = require('./routes/generalRoutes');
const parentServiceRoutes = require('./routes/parentServiceRoutes');
const childServiceRoutes = require('./routes/childServiceRoutes');
const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orderRoutes = require('./routes/orderRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const productTransactionRoutes = require('./routes/productTransactionRoutes');
const liveStockDashboardRoutes = require('./routes/liveStockDashboardRoutes');
const shelfTransferRoutes = require('./routes/shelfTransferRoutes');
const shelfDashboardRoutes = require('./routes/shelfDashboardRoutes');
const stockRoutes = require('./routes/stockRoutes');
const stockTransactionRoutes = require('./routes/stockTransactionRoutes');
const serviceFollowupRoutes = require('./routes/serviceFollowupRoutes');

const app = express();
const PORT = parseInt(process.env.PORT) || 3003;

app.use(express.json());

const database = new DatabaseConfig();
const consulConfig = new ConsulConfig({
  servicePort: PORT
});

app.use('/', unitRoutes);
app.use('/', attendanceRoutes);
app.use('/', generalRoutes);
app.use('/', parentServiceRoutes);
app.use('/', childServiceRoutes);
app.use('/', productRoutes);
app.use('/', clientRoutes);
app.use('/', vendorRoutes);
app.use('/', inventoryRoutes);
app.use('/', taskRoutes);
app.use('/', orderRoutes);
app.use('/', warehouseRoutes);
app.use('/', productTransactionRoutes);
app.use('/', liveStockDashboardRoutes);
app.use('/', shelfTransferRoutes);
app.use('/', shelfDashboardRoutes);
app.use('/', stockRoutes);
app.use('/', stockTransactionRoutes);
app.use('/', serviceFollowupRoutes);

async function startServer() {
  try {
    await database.connect();

    app.listen(PORT, async () => {
      console.log(`🚀 General service running on port ${PORT}`);
      console.log(`📍 Available endpoints:`);
      console.log(`   GET  /health - Service health check`);
      console.log(`   POST /addUnit - Create new unit`);
      console.log(`   POST /searchUnit - Search units`);
      console.log(`   POST /updateUnit - Update unit`);
      console.log(`   POST /deleteUnit - Delete unit`);
      console.log(`   GET  /getAllUnits - Get all active units`);
      console.log(`   GET  /getUnit/:id - Get unit by ID`);
      console.log(`   POST /addAttendance - Create new attendance`);
      console.log(`   POST /searchAttendance - Search attendances`);
      console.log(`   POST /updateAttendance - Update attendance`);
      console.log(`   POST /deleteAttendance - Delete attendance`);
      console.log(`   POST /addGeneral - Create new general`);
      console.log(`   POST /searchGeneral - Search generals`);
      console.log(`   POST /updateGeneral - Update general`);
      console.log(`   POST /deleteGeneral - Delete general`);
      console.log(`   POST /addParentService - Create new parent service`);
      console.log(`   POST /searchParentService - Search parent services`);
      console.log(`   POST /updateParentService - Update parent service`);
      console.log(`   POST /deleteParentService - Delete parent service`);
      console.log(`   POST /addChildService - Create new child service`);
      console.log(`   POST /searchChildService - Search child services`);
      console.log(`   POST /updateChildService - Update child service`);
      console.log(`   POST /deleteChildService - Delete child service`);
      console.log(`   POST /addProduct - Create new product`);
      console.log(`   POST /searchProduct - Search products`);
      console.log(`   POST /updateProduct - Update product`);
      console.log(`   POST /deleteProduct - Delete product`);
      console.log(`   POST /addClient - Create new client`);
      console.log(`   POST /searchClients - Search clients`);
      console.log(`   POST /updateClient - Update client`);
      console.log(`   POST /deleteClient - Delete client`);
      console.log(`   POST /addVendor - Create new vendor`);
      console.log(`   POST /searchVendor - Search vendors`);
      console.log(`   POST /updateVendor - Update vendor`);
      console.log(`   POST /deleteVendor - Delete vendor`);
      console.log(`   POST /addInventory - Create new inventory`);
      console.log(`   POST /searchInventory - Search inventories`);
      console.log(`   POST /updateInventory - Update inventory`);
      console.log(`   POST /deleteInventory - Delete inventory`);
      console.log(`   POST /addTask - Create new task`);
      console.log(`   POST /searchTask - Search tasks`);
      console.log(`   POST /updateTask - Update task`);
      console.log(`   POST /deleteTask - Delete task`);
      console.log(`   POST /addOrder - Create new order`);
      console.log(`   POST /searchOrder - Search orders`);
      console.log(`   POST /updateOrder - Update order`);
      console.log(`   POST /deleteOrder - Delete order`);
      console.log(`   POST /addShelfInventory - Create new shelf inventory`);
      console.log(`   POST /searchShelfInventory - Search shelf inventories`);
      console.log(`   POST /updateShelfInventory - Update shelf inventory`);
      console.log(`   POST /deleteShelfInventory - Delete shelf inventory`);
      console.log(`   POST /transferFromWarehouseToShelf - Transfer inventory from warehouse to shelf`);
      console.log(`   POST /addShelfTransfer - Create new shelf transfer`);
      console.log(`   POST /searchShelfTransfer - Search shelf transfers`);
      console.log(`   POST /updateShelfTransfer - Update shelf transfer`);
      console.log(`   POST /deleteShelfTransfer - Delete shelf transfer`);
      console.log(`   POST /addShelfDashboard - Create new shelf dashboard`);
      console.log(`   POST /searchShelfDashboard - Search shelf dashboards`);
      console.log(`   POST /updateShelfDashboard - Update shelf dashboard`);
      console.log(`   POST /deleteShelfDashboard - Delete shelf dashboard`);
      console.log(`   POST /addServiceFollowup - Create new service followup`);
      console.log(`   POST /searchServiceFollowup - Search service followups`);
      console.log(`   POST /updateServiceFollowup - Update service followup`);
      console.log(`   POST /deleteServiceFollowup - Delete service followup`);
      console.log(`   GET  /getAllServiceFollowups - Get all active service followups`);
      console.log(`   GET  /getServiceFollowup/:id - Get service followup by ID`);

      await consulConfig.registerService();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down general service...');
  await consulConfig.deregisterService();
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down general service...');
  await consulConfig.deregisterService();
  await database.disconnect();
  process.exit(0);
});

startServer();