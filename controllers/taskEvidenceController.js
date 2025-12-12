const TaskEvidence = require('../models/TaskEvidence');
const { Task } = require('../models/Task');

class TaskEvidenceController {
    async createTaskEvidence(req, res) {
        try {
            console.log('CreateTaskEvidence DTO:', JSON.stringify(req.body, null, 2));
            const taskEvidence = new TaskEvidence(req.body);
            await taskEvidence.save();

            console.log('Created TaskEvidence:', JSON.stringify(taskEvidence, null, 2));

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: "TaskEvidence created successfully",
                data: taskEvidence
            });
        } catch (error) {
            console.error('Error while creating task evidence:', error.message);
            res.status(400).json({
                success: false,
                statusCode: 400,
                error: error.message,
                message: 'Failed to create TaskEvidence'
            });
        }
    }

    // async searchTaskEvidence(req, res) {
    //     try {
    //         console.log('\n========== SEARCH TASK EVIDENCE DEBUG ==========');
    //         console.log('📥 Original Request Body:', JSON.stringify(req.body, null, 2));

    //         const options = {
    //             page: parseInt(req.body.page) || 1,
    //             limit: parseInt(req.body.limit) || 10,
    //             sort: req.body.sort || { createdAt: -1 },
    //             populate: req.body.populate || [
    //                 { path: 'taskId', model: 'Task' },
    //                 { path: 'userId', model: 'User' }
    //             ]
    //         };

    //         let query = req.body.search || {};
    //         console.log('🔍 Query Before Conversion:', JSON.stringify(query, null, 2));

    //         const mongoose = require('mongoose');

    //         // Convert string ObjectIds to actual ObjectIds for assignedTo field
    //         if (query.assignedTo && query.assignedTo.$in) {
    //             console.log('🔄 Converting assignedTo.$in from strings to ObjectIds...');
    //             query.assignedTo.$in = query.assignedTo.$in.map(id => {
    //                 try {
    //                     const objectId = new mongoose.Types.ObjectId(id);
    //                     console.log(`   ✅ Converted: "${id}" → ObjectId("${objectId}")`);
    //                     console.log(`   Type check: ${objectId instanceof mongoose.Types.ObjectId}`);
    //                     return objectId;
    //                 } catch (e) {
    //                     console.log(`   ❌ Failed to convert: "${id}" - ${e.message}`);
    //                     return id;
    //                 }
    //             });
    //         }

    //         // Convert for direct assignedTo query (not using $in)
    //         if (query.assignedTo && !query.assignedTo.$in && typeof query.assignedTo === 'string') {
    //             console.log('🔄 Converting direct assignedTo from string to ObjectId...');
    //             query.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
    //         }

    //         // Convert other ObjectId fields if present
    //         const objectIdFields = ['taskId', 'roleId', 'unitIds', 'userId'];
    //         objectIdFields.forEach(field => {
    //             if (query[field]) {
    //                 if (query[field].$in) {
    //                     console.log(`🔄 Converting ${field}.$in from strings to ObjectIds...`);
    //                     query[field].$in = query[field].$in.map(id => {
    //                         try {
    //                             return new mongoose.Types.ObjectId(id);
    //                         } catch (e) {
    //                             console.log(`   ❌ Failed to convert ${field}: "${id}" - ${e.message}`);
    //                             return id;
    //                         }
    //                     });
    //                 } else if (typeof query[field] === 'string') {
    //                     console.log(`🔄 Converting ${field} from string to ObjectId...`);
    //                     try {
    //                         query[field] = new mongoose.Types.ObjectId(query[field]);
    //                         console.log(`   ✅ Converted ${field}: "${query[field]}"`);
    //                     } catch (e) {
    //                         console.log(`   ❌ Failed to convert ${field}: ${e.message}`);
    //                     }
    //                 }
    //             }
    //         });

    //         console.log('✨ Query After Conversion:', JSON.stringify(query, null, 2));
    //         console.log('⚙️  Pagination Options:', JSON.stringify(options, null, 2));

    //         // Get total count without filters to check if collection has data
    //         const totalCount = await TaskEvidence.countDocuments({});
    //         console.log(`📊 Total TaskEvidence in DB: ${totalCount}`);

    //         // Get count with this specific query
    //         const matchCount = await TaskEvidence.countDocuments(query);
    //         console.log(`🎯 Matching documents for this query: ${matchCount}`);

    //         // Check assignedTo specifically
    //         if (query.assignedTo && query.assignedTo.$in) {
    //             const assignedToCount = await TaskEvidence.countDocuments({
    //                 assignedTo: query.assignedTo
    //             });
    //             console.log(`👤 Documents with assignedTo match (using full query.assignedTo): ${assignedToCount}`);

    //             // Test with just the first ID from $in array
    //             const firstId = query.assignedTo.$in[0];
    //             const singleIdCount = await TaskEvidence.countDocuments({
    //                 assignedTo: firstId
    //             });
    //             console.log(`👤 Documents with single assignedTo=${firstId}: ${singleIdCount}`);

    //             // Get a sample document to see the actual structure
    //             const sampleDoc = await TaskEvidence.findOne({ assignedTo: firstId })
    //                 .select('taskName assignedTo createdAt unitIds')
    //                 .lean();
    //             if (sampleDoc) {
    //                 console.log(`📄 Sample document found:`, JSON.stringify(sampleDoc, null, 2));
    //             } else {
    //                 console.log(`📄 No sample document found for assignedTo=${firstId}`);
    //             }
    //         }

    //         // Check createdAt range
    //         if (query.createdAt) {
    //             const timeRangeCount = await TaskEvidence.countDocuments({
    //                 createdAt: query.createdAt
    //             });
    //             console.log(`📅 Documents in createdAt range: ${timeRangeCount}`);
    //             console.log(`   Range: ${new Date(query.createdAt.$gte).toISOString()} to ${new Date(query.createdAt.$lte).toISOString()}`);
    //         }

    //         // Check unitIds if present
    //         if (query.unitIds) {
    //             const unitIdsCount = await TaskEvidence.countDocuments({
    //                 unitIds: query.unitIds
    //             });
    //             console.log(`🏢 Documents with unitIds match: ${unitIdsCount}`);
    //         }

    //         // Test each condition separately
    //         console.log('\n🔬 Testing Individual Conditions:');
    //         const conditions = {};
    //         let testResults = {};

    //         if (query.assignedTo) {
    //             conditions.assignedTo = query.assignedTo;
    //             testResults.assignedTo = await TaskEvidence.countDocuments({ assignedTo: query.assignedTo });
    //             console.log(`   assignedTo only: ${testResults.assignedTo} docs`);
    //         }

    //         if (query.createdAt) {
    //             conditions.createdAt = query.createdAt;
    //             testResults.createdAt = await TaskEvidence.countDocuments({ createdAt: query.createdAt });
    //             console.log(`   createdAt only: ${testResults.createdAt} docs`);
    //         }

    //         if (query.unitIds) {
    //             conditions.unitIds = query.unitIds;
    //             testResults.unitIds = await TaskEvidence.countDocuments({ unitIds: query.unitIds });
    //             console.log(`   unitIds only: ${testResults.unitIds} docs`);
    //         }

    //         // Test combinations
    //         if (query.assignedTo && query.createdAt) {
    //             const combo1 = await TaskEvidence.countDocuments({
    //                 assignedTo: query.assignedTo,
    //                 createdAt: query.createdAt
    //             });
    //             console.log(`   assignedTo + createdAt: ${combo1} docs`);
    //         }

    //         if (query.assignedTo && query.unitIds) {
    //             const combo2 = await TaskEvidence.countDocuments({
    //                 assignedTo: query.assignedTo,
    //                 unitIds: query.unitIds
    //             });
    //             console.log(`   assignedTo + unitIds: ${combo2} docs`);
    //         }

    //         const taskEvidences = await TaskEvidence.paginate(query, options);
    //         console.log(`📦 Results: ${taskEvidences.docs.length} documents returned`);
    //         console.log('========================================\n');

    //         res.json({ statusCode: 200, data: taskEvidences });
    //     } catch (error) {
    //         console.error('❌ Error while searching task evidence:', error.message);
    //         console.error('Stack:', error.stack);
    //         res.status(500).json({ statusCode: 500, error: error.message });
    //     }
    // }

    async updateTaskEvidence(req, res) {
        try {
            const { _id } = req.body;
            console.log('UpdateTaskEvidence DTO:', JSON.stringify(req.body, null, 2));

            if (!_id) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    error: 'TaskEvidence ID is required'
                });
            }

            req.body.updatedAt = Date.now();

            const taskEvidence = await TaskEvidence.findByIdAndUpdate(_id, req.body, { new: true });
            if (!taskEvidence) {
                return res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'TaskEvidence not found'
                });
            }

            console.log('Updated TaskEvidence:', JSON.stringify(taskEvidence, null, 2));

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'TaskEvidence updated successfully',
                data: taskEvidence
            });
        } catch (error) {
            console.error('Error while updating task evidence:', error.message);
            res.status(409).json({
                success: false,
                statusCode: 409,
                error: error.message,
                message: 'Failed to update TaskEvidence'
            });
        }
    }

    async deleteTaskEvidence(req, res) {
        try {
            const { _id } = req.body;
            console.log('DeleteTaskEvidence DTO:', JSON.stringify(req.body, null, 2));

            if (!_id) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    error: 'TaskEvidence ID is required'
                });
            }
            const taskEvidence = await TaskEvidence.findByIdAndDelete(_id);
            if (!taskEvidence) {
                return res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'TaskEvidence not found'
                });
            }

            console.log('Deleted TaskEvidence:', _id);

            res.status(200).json({
                success: true,
                statusCode: 200,
                message: 'TaskEvidence deleted successfully',
                data: taskEvidence
            });
        } catch (error) {
            console.error('Error while deleting task evidence:', error.message);
            res.status(400).json({
                success: false,
                statusCode: 400,
                error: error.message
            });
        }
    }

    // Debug endpoint to check what data exists for a user
    async debugTaskEvidence(req, res) {
        try {
            const { userId } = req.body;
            console.log('\n========== DEBUG TASK EVIDENCE ==========');
            console.log('Checking for userId:', userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    error: 'userId is required'
                });
            }

            const objectId = new require('mongoose').Types.ObjectId(userId);
            console.log('Converted to ObjectId:', objectId);

            // Get all task evidences for this user
            const allForUser = await TaskEvidence.find({ assignedTo: objectId })
                .select('taskName createdAt assignedTo status')
                .limit(10)
                .sort({ createdAt: -1 });

            console.log(`Found ${allForUser.length} TaskEvidences for this user`);

            // Get some sample data with createdAt timestamps
            const samples = allForUser.slice(0, 5).map(doc => ({
                _id: doc._id,
                taskName: doc.taskName,
                createdAt: doc.createdAt,
                createdAtDate: new Date(doc.createdAt).toISOString(),
                assignedTo: doc.assignedTo,
                status: doc.status
            }));

            console.log('Sample data:', JSON.stringify(samples, null, 2));

            // Get min and max createdAt
            const minMax = await TaskEvidence.aggregate([
                { $match: { assignedTo: objectId } },
                {
                    $group: {
                        _id: null,
                        minCreatedAt: { $min: '$createdAt' },
                        maxCreatedAt: { $max: '$createdAt' }
                    }
                }
            ]);

            console.log('========================================\n');

            res.json({
                success: true,
                statusCode: 200,
                data: {
                    totalCount: allForUser.length,
                    samples: samples,
                    dateRange: minMax[0] ? {
                        earliest: {
                            timestamp: minMax[0].minCreatedAt,
                            date: new Date(minMax[0].minCreatedAt).toISOString()
                        },
                        latest: {
                            timestamp: minMax[0].maxCreatedAt,
                            date: new Date(minMax[0].maxCreatedAt).toISOString()
                        }
                    } : null
                }
            });
        } catch (error) {
            console.error('Error in debug:', error.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                error: error.message
            });
        }
    }
    // async searchTaskEvidence(req, res) {

    //     try {
    //         const options = {
    //             page: parseInt(req.query.page) || 1,
    //             limit: parseInt(req.query.limit) || 10,
    //             sort: req.query.sort || '',
    //             populate: req.body.populate || [
    //                 {
    //                     path: 'taskId',
    //                     select: 'firstName lastName email'
    //                 }
    //             ]
    //         };


    //         const result = await TaskEvidence.paginate(req.body.search, options);

    //         console.log("result----<><><><>", result);

    //         res.json({
    //             success: true,
    //             statusCode: 200,
    //             data: result
    //         });
    //     } catch (error) {
    //         console.error('Error while searching task evidences:', error.message);
    //         res.status(500).json({
    //             success: false,
    //             statusCode: 500,
    //             error: error.message
    //         });
    //     }
    // }
    async searchTaskEvidence(req, res) {
        try {

            console.log("🔍 Incoming Search Request:");
            console.log("Query Params:", req.query);
            console.log("Body Params:", req.body);

            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: req.query.sort || '',
                populate: [

                    {
                        path: 'taskId',
                        select: 'firstName lastName email assignedTo',

                    }
                ]
            };
            const result = await TaskEvidence.paginate(req.body.search, options);

            console.log("✅ Search Result Count:", result.docs?.length);

            res.json({
                success: true,
                statusCode: 200,
                data: result
            });

        } catch (error) {
            console.error('❌ Error while searching task evidences:', error);

            res.status(500).json({
                success: false,
                statusCode: 500,
                error: error.message
            });
        }
    }


}

module.exports = new TaskEvidenceController();
