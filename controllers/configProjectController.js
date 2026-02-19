const ConfigProject = require('../models/ConfigProject');

// Create ConfigProject
const addConfigProject = async (req, res) => {
  try {
    const configProject = new ConfigProject(req.body);
    await configProject.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'ConfigProject created successfully',
      data: configProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating configProject',
      error: error.message
    });
  }
};

// Search ConfigProjects with pagination
const searchConfigProject = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate
    } = req.body;

    const query = { ...search };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: populate || []
    };

    const configProjects = await ConfigProject.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ConfigProjects fetched successfully',
      data: configProjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching configProjects',
      error: error.message
    });
  }
};

// Update ConfigProject
const updateConfigProject = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'ConfigProject ID is required'
      });
    }

    const configProject = await ConfigProject.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!configProject) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'ConfigProject not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ConfigProject updated successfully',
      data: configProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating configProject',
      error: error.message
    });
  }
};

// Delete ConfigProject
const deleteConfigProject = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'ConfigProject ID is required'
      });
    }

    const configProject = await ConfigProject.findByIdAndDelete(_id);

    if (!configProject) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'ConfigProject not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ConfigProject deleted successfully',
      data: configProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting configProject',
      error: error.message
    });
  }
};

module.exports = {
  addConfigProject,
  searchConfigProject,
  updateConfigProject,
  deleteConfigProject
};
