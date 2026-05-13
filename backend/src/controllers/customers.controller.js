const prisma = require('../config/database');

const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        accounts: true,
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            details: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, rfc } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        rfc: rfc || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: customer
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente'
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, rfc } = req.body;

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(rfc !== undefined && { rfc: rfc || null })
      }
    });

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: customer
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente'
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const salesCount = await prisma.sale.count({
      where: { customerId: parseInt(id) }
    });

    if (salesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el cliente porque tiene ${salesCount} ventas asociadas`
      });
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
