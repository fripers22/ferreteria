const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

/** Registro público de usuario (self-signup)
 * Body: { email, fullName, password, confirmPassword }
 */
const register = async (req, res) => {
  try {
    const { email, fullName, password, confirmPassword } = req.body;

    if (!email || !fullName || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    // Verificar email único
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: email }] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email/username' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Usaremos el email como username por simplicidad
    const user = await prisma.user.create({
      data: {
        username: email,
        email,
        password: hashed,
        fullName,
        role: 'VENDEDOR',
        active: true
      },
      select: { id: true, username: true, email: true, fullName: true, role: true }
    });

    res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: user });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/** Creación de usuario por ADMIN
 * Body: { email, fullName, password, role }
 */
const createUserByAdmin = async (req, res) => {
  try {
    const { email, fullName, password, role } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ success: false, message: 'email, fullName y password son requeridos' });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: email }] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email/username' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: email,
        email,
        password: hashed,
        fullName,
        role: role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR',
        active: true
      },
      select: { id: true, username: true, email: true, fullName: true, role: true }
    });

    res.status(201).json({ success: true, message: 'Usuario creado por admin', data: newUser });
  } catch (error) {
    console.error('Error en createUserByAdmin:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, fullName: true, role: true, active: true, createdAt: true } });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error en listUsers:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN','VENDEDOR'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role inválido' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, username: true, email: true, fullName: true, role: true }
    });

    res.json({ success: true, message: 'Rol actualizado', data: user });
  } catch (error) {
    console.error('Error en updateUserRole:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { register, createUserByAdmin, listUsers, updateUserRole };
