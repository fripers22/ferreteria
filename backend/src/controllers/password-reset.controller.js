// Controlador de Recuperación de Contraseña
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Solicitar recuperación de contraseña
 * POST /api/password-reset/request
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Buscar usuario por email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // Si no hay usuario con ese email, buscar por username
    if (!user && email.includes('@')) {
      // Es un email, no existe
      console.log(`Email no encontrado: ${email}`);
    } else if (!user) {
      // Intentar buscar por username
      user = await prisma.user.findUnique({
        where: { username: email }
      });
    }

    // IMPORTANTE: Por seguridad, no revelar si el email existe
    // Responder siempre positivamente
    
    const response = {
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación en 5 minutos'
    };

    // Si el usuario existe, enviar email en segundo plano
    if (user && user.email) {
      try {
        // Generar token seguro
        const token = crypto.randomBytes(32).toString('hex');
        
        // Guardar token en BD con expiración de 1 hora
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora
        
        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            token,
            email: user.email,
            expiresAt
          }
        });

        // Construir URL de reseteo
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

        // Responder al usuario lo antes posible y disparar el email en background
        setImmediate(async () => {
          try {
            await emailService.sendPasswordResetEmail(
              user.email,
              user.fullName,
              resetUrl
            );

            console.log(`✅ Email de recuperación enviado a ${user.email}`);
          } catch (emailError) {
            console.error('❌ Error enviando email en background:', emailError);
          }
        });
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No revelar el error al usuario
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error en requestPasswordReset:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Verificar token de recuperación
 * GET /api/password-reset/verify/:token
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord) {
      return res.status(404).json({ error: 'Token inválido' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Este enlace ya ha sido utilizado' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: 'Este enlace ha expirado' });
    }

    // Token válido
    res.status(200).json({
      valid: true,
      user: {
        id: resetRecord.user.id,
        username: resetRecord.user.username,
        fullName: resetRecord.user.fullName,
        role: resetRecord.user.role
      }
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Resetear contraseña
 * POST /api/password-reset/reset
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord) {
      return res.status(404).json({ error: 'Token inválido' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Este enlace ya ha sido utilizado' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: 'Este enlace ha expirado' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: resetRecord.user.id },
      data: { password: hashedPassword }
    });

    // Marcar token como usado
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    // Enviar email de confirmación
    await emailService.sendPasswordChangedEmail(
      resetRecord.email,
      resetRecord.user.fullName
    );

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error reseteando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = exports;
