const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour créer un utilisateur
router.post('/', userController.createUser);

// Route pour lire tous les utilisateurs
router.get('/', userController.getUsers);

module.exports = router;
