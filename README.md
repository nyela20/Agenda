# Agenda - Projet Master 1 Informatique

## Description du Projet
Ce projet est un gestionnaire d'agenda simple et efficace, réalisé dans le cadre d'un Master 1 Informatique. Il permet à un utilisateur de gérer des événements et de réinitialiser son mot de passe grâce à l'intégration de Mailtrap et MongoDB.

---

## Lancement du Projet

### 1. Installation des dépendances
Pour configurer le projet, exécutez les commandes suivantes dans votre terminal :
```bash
npm install
npm install nodemailer crypto
npm start
```

### 2. Accès à l'application
Une fois le projet lancé, ouvrez votre navigateur et accédez à :
```
localhost:3000
```

### 3. Configuration de Mailtrap
Pour utiliser la fonctionnalité de réinitialisation de mot de passe, un compte Mailtrap est nécessaire.
Ajoutez les informations suivantes dans un fichier `.env` au niveau de `app.js` :
```
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_USER=
MAIL_PASS=
MAIL_PORT=
```

---

## Installation de MongoDB

1. **Télécharger et installer MongoDB Compass**
   - Rendez-vous sur [MongoDB Compass](https://www.mongodb.com/try/download/community) pour installer l'application.

2. **Connexion au serveur**
   - Connectez-vous sur le port par défaut : `27017`.

3. **Création de la base de données**
   - Nom de la base : `Agenda`
   - Nom de la collection : `users`

---

## Fonctionnalités Clés
- Gestion des utilisateurs
- Intégration avec MongoDB pour le stockage des données
- Réinitialisation de mot de passe via Mailtrap

---



