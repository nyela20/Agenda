const User = require('../models/user');
const RendezVous = require('../models/rendezvous.js'); 
const Agenda = require('../models/agenda.js'); 
const bcrypt = require('bcrypt'); // pour le mot de passe hasher
// pour reset password via mail
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // token pour reset password
const { error } = require('console');
require('dotenv').config();

const SALT_ROUNDS = 10; // Nombre de tours de salage pour bcrypt

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { name, email, password , confirmPassword } = req.body;

    // validation mail 
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).render('register', { error: 'Adresse email invalide.' });
    }

    if(name.length < 4 ){
      return res.status(400).render('register', { error: 'le nom doit contenir au moins 4 caractères.' });
    }

    // validation password
    if(password.length < 6){
      return res.status(400).render('register', { error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

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

exports.getUserByMail = async (req, res) => {
  try {
    const users = localStorage.getItem("userEmail");
    const temp = await User.findOne({"email":users});
    return temp;
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.updateUserByMail = async (req, res) => {
  try {
    
    const{nom , email} = req.body;
    const oldMail = localStorage.getItem("userEmail");
    
    await User.updateOne({"email":oldMail},{$set:{"nom":nom,"email":email}});



    await RendezVous.updateMany({"createurEmail":oldMail},{$set:{"createurEmail":email}});

    await Agenda.updateMany({"createurEmail":oldMail},{$set:{"createurEmail":email}});

    localStorage.setItem("userEmail",email);
    res.redirect("/agenda");
    // res.status(200).send(temp);

  } catch (err) {
    res.status(500).send(err);
  }
};

const transporter = nodemailer.createTransport({
  host : process.env.MAIL_HOST ,
  port : process.env.MAIL_PORT,
  auth:{
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS
  }
});


// mot de pass oblié
exports.forgotPassword = async (req , res) => {
  try {
    const email = req.body.email;

    // generer un token 
    const token = crypto.randomBytes(32).toString('hex');

    //chercher l'utilisateur et mettre à jour avec le token 
    const user = await User.findOne({ email: email });
    if(!user){
      return res.render('forgot-password' ,{
        error : 'Aucun compte associe à cette addresse mail.'
      });
    }

    user.resetPassWordToken = token;
    user.resetPassWordExpires =  Date.now() + ( 20 * 60 * 1000 ); // expirées dans 20 min
    //save dans la base de données 
    await user.save();
    
    
    // envoye le mail
    const resetURL = `http://localhost:3000/users/reset-password/${token}`;
    const mailOption = {
      to: user.email,
      from : 'agenda support <support@agenda.com>',
      subject: 'Réinitialisation mot de passe Agenda',
      text: `Bonjour \n\nPour votre demande de réinitialisation de mot de passe, veuillez cliquer sur le lien suivant\n\n
      ${resetURL}\n\n`
    };

    await transporter.sendMail(mailOption);
    res.render('forgot-password', { 
      error: 'Un email de réinitialisation a été envoyé à votre adresse.' 
    });

    
  } catch (err) {
    res.render('forgot-password', { error: err.message });
  }
}

// affiche formulaire resetPassword
exports.getResetPassword = async (req , res) =>{
  try {
    const user = await User.findOne({
      resetPassWordToken : req.params.token,
      resetPassWordExpires : {$gt : Date.now()}
    });
    if(!user || !req.params.token){
      return res.render('reset-password',{
        error : 'Le lien de réinitialisation est invalide ou a expiré.',
        token: null,
        linkExpired : true
      });
    }
    res.render('reset-password' , {
      error : null ,
      token : req.params.token,
      linkExpired : false
    });
    
  } catch (error) {
    res.render('reset-password', { error: err.message });
  }
}

// traite le nouveau mot de passe 
exports.postResetPassword = async (req , res ) =>{
  try {

    const password  = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if(password.length < 6 ){
      return res.render('reset-password' , 
        { 
          error: 'Le mot de passe doit contenir au moins 6 caractères.' 

        });
    } 

    if(password !==  confirmPassword ){
      return res.render('reset-password' , 
        { 
          error: 'Les mots de passe ne correspondent pas.' 

        });
    }

    const user = await User.findOne({
      resetPassWordToken :  req.params.token,
      resetPassWordExpires : {$gt: Date.now()}
    });

    if(!user){
      return res.render('reset-password' , 
        { 
          error: 'Le token a expiré.' 

        });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    user.password =  hashedPassword ;
    user.resetPassWordToken = undefined;
    user.resetPassWordExpires = undefined;
    await user.save();

    res.redirect('/users/login');
  } catch (error) {
    res.render('reset-password', { error: err.message });
  }
}

