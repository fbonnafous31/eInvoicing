/**
 * Script générique pour tester l'envoi d'e-mails avec Nodemailer.
 * Compatible avec n'importe quel serveur SMTP (Hotmail, Gmail, Brevo, etc.).
 * 
 * Utilisation :
 * 1️⃣ Configurez les variables d'environnement avant de lancer :
 * 
 *    export SMTP_HOST="smtp.office365.com"
 *    export SMTP_PORT=587
 *    export SMTP_SECURE=false
 *    export SMTP_USER="votre-adresse@hotmail.fr"
 *    export SMTP_PASS="votre-mot-de-passe-ou-app-password"
 *    export SMTP_FROM="votre-adresse@hotmail.fr"
 *    export SMTP_TO="adresse-de-destination@example.com"
 * 
 * 2️⃣ Exécutez :
 *    node testEmail.js
 */

require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

async function testEmail() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    SMTP_TO
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_TO) {
    console.error('❌ Erreur : certaines variables d’environnement SMTP sont manquantes.');
    console.error('Veuillez définir SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_TO.');
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true', // true pour 465, false pour 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
    });

    console.log('✅ Test de connexion au serveur SMTP...');
    await transporter.verify();
    console.log('🔗 Connexion réussie ! Envoi du mail de test...');

    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: SMTP_TO,
      subject: 'Test de mail - eInvoicing',
      text: 'Ceci est un test d’envoi d’email via Nodemailer.',
    });

    console.log('📨 Email envoyé avec succès !');
    console.log('📋 Réponse du serveur:', info.response);

  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du mail :', error.message);
  }
}

testEmail();
