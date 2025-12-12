const express = require('express');
const router = express.Router();
const taskEvidenceController = require('../controllers/taskEvidenceController');

router.post('/createTaskEvidence', (req, res) => taskEvidenceController.createTaskEvidence(req, res));
router.post('/searchTaskEvidence', (req, res) => taskEvidenceController.searchTaskEvidence(req, res));
router.post('/updateTaskEvidence', (req, res) => taskEvidenceController.updateTaskEvidence(req, res));
router.post('/deleteTaskEvidence', (req, res) => taskEvidenceController.deleteTaskEvidence(req, res));
router.post('/debugTaskEvidence', (req, res) => taskEvidenceController.debugTaskEvidence(req, res));

module.exports = router;
