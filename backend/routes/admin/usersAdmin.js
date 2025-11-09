// backend/routes/admin/usersAdmin.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const checkAdmin = require('../../middleware/checkAdmin');

module.exports = (upload) => {
    router.get('/', checkAdmin, userController.getAllUsers);
    router.get('/:id', checkAdmin, userController.getUserById);
    router.post('/', checkAdmin, upload.single('avatar'), userController.createUser);
    router.put('/:id', checkAdmin, upload.single('avatar'), userController.updateUser);
    router.delete('/:id', checkAdmin, userController.deleteUser);
  router.post('/:id/reset-password', checkAdmin, userController.resetPasswordByAdmin);
 return router;
};