const User = require('../models/user');
const bcrypt = require('bcrypt'); // pour le mot de passe hasher

const SALT_ROUNDS = 10; // Nombre de tours de salage pour bcrypt

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { name, email, password , confirmPassword } = req.body;

    if(password !== confirmPassword){
      return res.status(400).render('register', { error: 'Les mots de passe ne correspondent pas.' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // const user = new User(req.body);
    const user = new User({
      name,
      email,
      password: hashedPassword // Sauvegarder le mot de passe hashé
    });
    await user.save();
    res.redirect('/users/login');
    //res.status(201).send(user);
  } catch (err) {
    //res.status(400).send(err);
    res.status(400).render('register', { error: err.message });
  }
};

// connecter un utilisateur
exports.loginUser = async (req , res) =>{
  try{
    const {email , password} = req.body;
    const user = await User.findOne({ email });
    
    if( !user ){
      return res.status(400).render('login' ,{error: 'Utilisateur non trouvé '});

    }
    const isMatch = await bcrypt.compare(password , user.password);
    if(!isMatch ){
      return res.status(400).render('login' ,{error: 'Mot de passe incorrect  '});
    }
    
    // enregistrer le mail de l utilisateur connecte
    localStorage.setItem('userEmail', email);
    
    res.redirect('/agenda'); // rediger vers la page principale
  }catch(err){
    res.status(500).render('login', { error: err.message });
  }
};

// Lire tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
};
// Déconnexion d'un utilisateur
exports.logoutUser = async (req, res) => {
  //Vide de localStorage sans vérifier l'email
  localStorage.clear(); 
  res.redirect('/');
};