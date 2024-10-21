const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour créer un utilisateur
router.post('/register', userController.createUser);

// Route pour lire tous les utilisateurs
router.get('/', userController.getUsers);

// route pour afficher le formulaire de creation compte
router.get('/register' , (req ,res) =>{
    res.render('register' , { error: null });
});

//route pour afficher le formulaire de connexion
router.get('/login' , (req , res)=>{
    res.render('login', { error: null });
});

// Route pour traiter la connexion
router.post('/login', userController.loginUser);
// Route de déconnexion
router.get('/logout', userController.logoutUser);

module.exports = router;
