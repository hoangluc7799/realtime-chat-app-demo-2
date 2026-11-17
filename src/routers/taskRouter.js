
const express = require('express');
const router = express.Router();

const taskController = require('../controllers/TaskController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);


router.get('/create', taskController.showCreateTask);
router.post('/', taskController.create);
/* router.get('/', taskController.showEditTask); */
router.get('/:id/edit', taskController.edit);
router.patch('/:id', taskController.update);
router.delete('/:id', taskController.remove);

module.exports = router;
