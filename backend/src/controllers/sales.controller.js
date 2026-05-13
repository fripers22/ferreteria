const prisma = require('../config/database');

const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, customerId, paymentMethod } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59')
      };
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: { id: true, fullName: true }
        },
        details: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas'
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        user: {
          select: { id: true, fullName: true }
        },
        details: {
          include: { product: true }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta'
    });
  }
};

const createSale = async (req, res) => {
  try {
    const { customerId, items, paymentMethod, discount = 0 } = req.body;
    const userId = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La venta debe tener al menos un producto'
      });
    }

    // Verificar stock y calcular totales
    let subtotal = 0;
    const saleDetails = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) }
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${item.productId} no encontrado`
        });
      }

      if (!product.active) {
        return res.status(400).json({
          success: false,
          message: `El producto "${product.name}" está desactivado`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        });
      }

      const itemSubtotal = parseFloat(product.salePrice) * item.quantity;
      subtotal += itemSubtotal;

      saleDetails.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: parseFloat(product.salePrice),
        subtotal: itemSubtotal
      });
    }

    const tax = subtotal * 0.16;
    const total = subtotal - parseFloat(discount) + tax;

    // Crear venta con transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          customerId: customerId ? parseInt(customerId) : null,
          userId,
          subtotal,
          discount: parseFloat(discount),
          tax,
          total,
          paymentMethod,
          paid: paymentMethod !== 'FIADO',
          details: {
            create: saleDetails
          }
        },
        include: {
          customer: true,
          user: { select: { id: true, fullName: true } },
          details: { include: { product: true } }
        }
      });

      // Actualizar stock de productos
      for (const item of items) {
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        // Registrar movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId: parseInt(item.productId),
            userId,
            type: 'SALIDA',
            quantity: item.quantity,
            reason: `Venta #${newSale.id}`
          }
        });
      }

      // Si es fiado, agregar cargo a la cuenta del cliente
      if (paymentMethod === 'FIADO' && customerId) {
        let account = await tx.account.findFirst({
          where: { customerId: parseInt(customerId) }
        });

        if (!account) {
          account = await tx.account.create({
            data: {
              customerId: parseInt(customerId),
              balance: 0,
              creditLimit: 5000
            }
          });
        }

        if (parseFloat(account.balance) + total > parseFloat(account.creditLimit)) {
          throw new Error(`El cliente excede su límite de crédito. Límite: $${account.creditLimit}, Saldo actual: $${account.balance}`);
        }

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: { increment: total },
            lastActivity: new Date()
          }
        });

        await tx.accountTransaction.create({
          data: {
            accountId: account.id,
            userId,
            type: 'CARGO',
            amount: total,
            description: `Venta #${newSale.id} a crédito`
          }
        });
      }

      return newSale;
    });

    res.status(201).json({
      success: true,
      message: 'Venta creada correctamente',
      data: sale
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear venta'
    });
  }
};

const cancelSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { details: true }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Revertir stock y movimientos
    await prisma.$transaction(async (tx) => {
      for (const detail of sale.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: { stock: { increment: detail.quantity } }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: detail.productId,
            userId,
            type: 'ENTRADA',
            quantity: detail.quantity,
            reason: `Cancelación de venta #${sale.id}`
          }
        });
      }

      // Si era fiado, revertir cargo
      if (sale.paymentMethod === 'FIADO' && sale.customerId) {
        const account = await tx.account.findFirst({
          where: { customerId: sale.customerId }
        });

        if (account) {
          await tx.account.update({
            where: { id: account.id },
            data: {
              balance: { decrement: parseFloat(sale.total) },
              lastActivity: new Date()
            }
          });

          await tx.accountTransaction.create({
            data: {
              accountId: account.id,
              userId,
              type: 'ABONO',
              amount: parseFloat(sale.total),
              description: `Cancelación de venta #${sale.id}`
            }
          });
        }
      }

      await tx.sale.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({
      success: true,
      message: 'Venta cancelada correctamente'
    });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar venta'
    });
  }
};

const getDailySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        customer: true,
        user: { select: { fullName: true } },
        details: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const totalTransactions = sales.length;

    res.json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales,
          totalTransactions,
          averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas del día'
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  cancelSale,
  getDailySales
};
