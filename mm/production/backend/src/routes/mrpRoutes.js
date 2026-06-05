const express = require('express');
const router = express.Router();
const controller = require('../controllers/mrpController');

router.get('/', controller.getRequirements);  
router.post('/run', controller.run);

module.exports = router;