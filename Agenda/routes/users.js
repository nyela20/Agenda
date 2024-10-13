const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour créer un utilisateur
router.post('/register', userController.createUser);

// Route pour lire tous les utilisateurs
router.get('/', userController.getUsers);

// route pour afficher le formulaire de creation compte
router.get('/register' , (req ,res) =>{
    res.render('register');
});

//route pour afficher le formulaire de connexion
router.get('/login' , (req , res)=>{
    res.render('login');
});

// Route pour traiter la connexion
router.post('/login', userController.loginUser);


module.exports = router;
