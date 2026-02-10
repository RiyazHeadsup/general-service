// Verify task evidence was created
require('dotenv').config();
const mongoose = require('mongoose');

async function verifyEvidence() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const taskId = '693be9f6082739ae28bd66a3';

    // Find all evidence for this task
    const evidences = await mongoose.connection.db.collection('taskevidences').find({
      taskId: new mongoose.Types.ObjectId(taskId)
    }).sort({ createdAt: 1 }).toArray();

    console.log(`📊 Found ${evidences.length} task evidence(s) for Monthly Task\n`);

    if (evidences.length > 0) {
      console.log('✅ SUCCESS! Task evidences created:\n');
      evidences.forEach((evidence, index) => {
        const date = new Date(evidence.createdAt);
        console.log(`${index + 1}. Evidence ID: ${evidence._id}`);
        console.log(`   Date: ${date.toDateString()}`);
        console.log(`   Status: ${evidence.status}`);
        console.log(`   Assigned To: ${evidence.assignedTo?.length || 0} users`);
        console.log(`   Task Name: ${evidence.taskName}`);
        console.log('');
      });
    } else {
      console.log('❌ No evidence found in database');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyEvidence();
