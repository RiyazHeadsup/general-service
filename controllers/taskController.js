const { Task } = require('../models/Task');
const { Role } = require('../models/Role');
const { User } = require('../models/User');
const { Unit } = require('../models/Unit');


const { model } = require('mongoose');


class TaskController {
  async createTask(req, res) {
    try {
      const task = new Task(req.body);
      await task.save();
      res.status(200).json({
        success: true,
        message: "task created successfully",
        statusCode: 201,
        data: task
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchTask(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'roleId', model: 'Role' },
          { path: 'unitIds', model: 'Unit' },
          { path: 'assignedTo', model: 'User' }
        ]
      };
      const tasks = await Task.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: tasks });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateTask(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      const task = await Task.findByIdAndUpdate(_id, req.body, { new: true });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ statusCode: 200, data: task });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      const task = await Task.findByIdAndRemove(_id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ statusCode: 200, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TaskController();