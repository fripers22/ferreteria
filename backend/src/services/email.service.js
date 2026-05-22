// Email Service - Soporta Gmail, Mailgun y Resend
const axios = require('axios');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Detectar qué proveedor usar
    this.provider = process.env.EMAIL_PROVIDER || 'gmail';
    
    if (this.provider === 'mailgun') {
      this.mailgunApiKey = process.env.MAILGUN_API_KEY;
      this.mailgunDomain = process.env.MAILGUN_DOMAIN;
      this.mailgunEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${this.mailgunDomain}`;
    } else if (this.provider === 'resend') {
      this.resendApiKey = process.env.RESEND_API_KEY;
      this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
    } else if (this.provider === 'gmail') {
      this.gmailUser = process.env.GMAIL_USER;
      this.gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
      this.fromEmail = process.env.GMAIL_FROM_EMAIL || this.gmailUser;
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.gmailUser,
          pass: this.gmailAppPassword
        }
      });
      console.log(`📬 Email provider set to Gmail. From: ${this.fromEmail}`);

      // Verificar transporter en arranque para detectar fallos de autenticación tempranos
      if (!this.gmailUser || !this.gmailAppPassword) {
        console.warn('⚠️ Gmail credentials missing: GMAIL_USER or GMAIL_APP_PASSWORD is not set. Emails will fail until configured.');
      } else {
        this.gmailTransporter.verify()
          .then(() => {
            console.log('✅ Gmail transporter verificado correctamente.');
          })
          .catch((err) => {
            console.error('❌ Falló la verificación del Gmail transporter:', err && err.message ? err.message : err);
          });
      }
    }
  }

  /**
   * Envía email de recuperación de contraseña
   * @param {string} email - Email del usuario
   * @param {string} fullName - Nombre completo del usuario
   * @param {string} resetUrl - URL con token para resetear contraseña
   */
  async sendPasswordResetEmail(email, fullName, resetUrl) {
    try {
      const subject = '🔐 Recuperar tu contraseña - FerreSync';
      const htmlContent = this.getPasswordResetTemplate(fullName, resetUrl);
      const textContent = `Hola ${fullName}, haz click en este enlace para recuperar tu contraseña: ${resetUrl}`;

      if (this.provider === 'mailgun') {
        return await this.sendViaMailgun(email, subject, htmlContent, textContent);
      } else if (this.provider === 'resend') {
        return await this.sendViaResend(email, subject, htmlContent, textContent);
      } else if (this.provider === 'gmail') {
        return await this.sendViaGmail(email, subject, htmlContent, textContent);
      } else {
        throw new Error(`Email provider no soportado: ${this.provider}`);
      }
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      throw error;
    }
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedEmail(email, fullName) {
    try {
      const subject = '✅ Tu contraseña ha sido actualizada - FerreSync';
      const htmlContent = this.getPasswordChangedTemplate(fullName);
      const textContent = `Hola ${fullName}, tu contraseña ha sido actualizada exitosamente.`;

      if (this.provider === 'mailgun') {
        return await this.sendViaMailgun(email, subject, htmlContent, textContent);
      } else if (this.provider === 'resend') {
        return await this.sendViaResend(email, subject, htmlContent, textContent);
      } else if (this.provider === 'gmail') {
        return await this.sendViaGmail(email, subject, htmlContent, textContent);
      }

      throw new Error(`Email provider no soportado: ${this.provider}`);
    } catch (error) {
      console.error('❌ Error enviando email de confirmación:', error);
      throw error;
    }
  }

  /**
   * Envía email vía Mailgun
   */
  async sendViaMailgun(email, subject, htmlContent, textContent) {
    const url = `https://api.mailgun.net/v3/${this.mailgunDomain}/messages`;
    
    const formData = new URLSearchParams();
    formData.append('from', this.mailgunEmail);
    formData.append('to', email);
    formData.append('subject', subject);
    formData.append('text', textContent);
    formData.append('html', htmlContent);

    const response = await axios.post(url, formData, {
      auth: {
        username: 'api',
        password: this.mailgunApiKey
      }
    });

    console.log(`✅ Email enviado vía Mailgun a ${email}`);
    return response.data;
  }

  /**
   * Envía email vía Resend
   */
  async sendViaResend(email, subject, htmlContent, textContent) {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: this.fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent
      },
      {
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Email enviado vía Resend a ${email}`);
    return response.data;
  }

  /**
   * Envía email vía Gmail (Nodemailer)
   */
  async sendViaGmail(email, subject, htmlContent, textContent) {
    if (!this.gmailUser || !this.gmailAppPassword) {
      throw new Error('Faltan variables GMAIL_USER o GMAIL_APP_PASSWORD');
    }

    try {
      const info = await this.gmailTransporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Email enviado vía Gmail a ${email} (messageId=${info && info.messageId ? info.messageId : 'unknown'})`);
      return info;
    } catch (err) {
      console.error('❌ Error enviando email vía Gmail:', err && err.message ? err.message : err);
      // Re-throw para que la capa superior (controlador) lo capture si lo necesita
      throw err;
    }
  }

  /**
   * Template HTML para email de recuperación
   */
  getPasswordResetTemplate(fullName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; }
          .warning { background: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${fullName}</strong>,</p>
            
            <p>Recibimos una solicitud para recuperar tu contraseña en <strong>FerreSync</strong>.</p>
            
            <p>Haz clic en el botón de abajo para establecer una nueva contraseña:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Recuperar Contraseña</a>
            </center>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p><code style="background: #f3f4f6; padding: 5px; word-break: break-all;">${resetUrl}</code></p>
          </div>
          <div class="footer">
            <p>© 2025 FerreSync. Este es un email automático, no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template HTML para email de confirmación
   */
  getPasswordChangedTemplate(fullName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
          .success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Contraseña Actualizada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${fullName}</strong>,</p>
            
            <div class="success">
              <strong>✓ Tu contraseña ha sido actualizada exitosamente.</strong>
            </div>
            
            <p>Ahora puedes acceder a <strong>FerreSync</strong> con tu nueva contraseña.</p>
            
            <p>Si no realizaste este cambio, contáctanos inmediatamente.</p>
          </div>
          <div class="footer">
            <p>© 2025 FerreSync. Este es un email automático, no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
