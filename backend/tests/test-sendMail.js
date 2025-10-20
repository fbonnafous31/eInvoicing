const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com', // remplacez par votre hôte SMTP
    port: 587,  // remplacez par le port SMTP approprié
    secure: false,
    auth: {
      user: 'votre-adresse-email', // remplacez par votre adresse SMTP
      pass: 'votre-mot-de-passe'  // remplacez par le mot de passe SMTP
    }
  });

  const info = await transporter.sendMail({
    from: 'francois.bonnafous@hotmail.fr', // **même que SMTP_USER**
    to: 'ton-email-personnel@example.com',
    subject: 'Test mail avec Node.js',
    text: 'Ceci est un test'
  });

  console.log('Email envoyé:', info.response);
}

testEmail();
