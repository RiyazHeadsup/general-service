// Fix monthly task to include ALL weeks
require('dotenv').config();
const mongoose = require('mongoose');

async function fixMonthlyTask() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const taskId = '693be9f6082739ae28bd66a3';

    console.log(`Updating task ${taskId}...`);

    const result = await mongoose.connection.db.collection('tasks').updateOne(
      {
        _id: new mongoose.Types.ObjectId(taskId)
      },
      {
        $set: {
          monthWeeks: [1, 2, 3, 4, 5],  // ALL weeks
          taskcreatedformonth: null      // Reset
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Task updated successfully!\n');
      console.log('📅 Updated configuration:');
      console.log('   monthWeeks: [1, 2, 3, 4, 5] (All weeks)');
      console.log('   taskcreatedformonth: null (Reset)\n');
      console.log('🎯 Now the task will create evidence for:');
      console.log('   - Every Monday (weekDay: 1)');
      console.log('   - Every Thursday (weekDay: 4)');
      console.log('   - For all future dates in the current month\n');
      console.log('📍 For December 2025, it will create:');
      console.log('   - Mon Dec 16, 2025 (Week 3)');
      console.log('   - Thu Dec 19, 2025 (Week 3)');
      console.log('   - Mon Dec 23, 2025 (Week 4)');
      console.log('   - Thu Dec 26, 2025 (Week 4)');
      console.log('   - Mon Dec 30, 2025 (Week 5)\n');
      console.log('✅ Now run: curl -X POST http://localhost:3003/trigger-monthly-task\n');
    } else {
      console.log('⚠️  No changes made (task might already be updated)');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMonthlyTask();
