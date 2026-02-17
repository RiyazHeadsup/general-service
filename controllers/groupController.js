const Group = require('../models/Group');

// Create Group
const addGroup = async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating group',
      error: error.message
    });
  }
};

// Search Groups with pagination
const searchGroup = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
      unitIds,
      populate = []
    } = req.body;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (unitIds) {
      query.unitIds = { $in: Array.isArray(unitIds) ? unitIds : [unitIds] };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    if (populate && populate.length > 0) {
      options.populate = populate;
    }

    const groups = await Group.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Groups fetched successfully',
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// Update Group
const updateGroup = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Group ID is required'
      });
    }

    const group = await Group.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Group not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating group',
      error: error.message
    });
  }
};

// Delete Group
const deleteGroup = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Group ID is required'
      });
    }

    const group = await Group.findByIdAndDelete(_id);

    if (!group) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Group not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Group deleted successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting group',
      error: error.message
    });
  }
};

module.exports = {
  addGroup,
  searchGroup,
  updateGroup,
  deleteGroup
};
