const prisma = require('../config/database');

const getMovements = async (req, res) => {
  try {
    const { productId, type, startDate, endDate } = req.query;

    const where = {};

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59')
      };
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: true,
        user: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos'
    });
  }
};

const createMovement = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    const userId = req.user.userId;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (type === 'SALIDA' && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${product.stock}`
      });
    }

    let newStock = product.stock;
    if (type === 'ENTRADA') {
      newStock += parseInt(quantity);
    } else if (type === 'SALIDA') {
      newStock -= parseInt(quantity);
    } else if (type === 'AJUSTE') {
      newStock = parseInt(quantity);
    }

    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          userId,
          type,
          quantity: parseInt(quantity),
          reason: reason || null
        },
        include: {
          product: true,
          user: { select: { fullName: true } }
        }
      }),
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: { stock: newStock }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Movimiento registrado correctamente',
      data: movement
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear movimiento'
    });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        stock: { lte: prisma.product.fields.minStock }
      },
      include: { category: true },
      orderBy: { stock: 'asc' }
    });

    // Filtrar productos donde stock <= minStock
    const lowStock = await prisma.$queryRaw`
      SELECT p.*, c.name as "categoryName"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p.active = true AND p.stock <= p."minStock"
      ORDER BY p.stock ASC
    `;

    res.json({
      success: true,
      data: lowStock
    });
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con bajo stock'
    });
  }
};

const getInventoryValue = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        costPrice: true,
        salePrice: true
      }
    });

    const totalCostValue = products.reduce(
      (sum, p) => sum + (parseFloat(p.costPrice) * p.stock),
      0
    );

    const totalSaleValue = products.reduce(
      (sum, p) => sum + (parseFloat(p.salePrice) * p.stock),
      0
    );

    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    res.json({
      success: true,
      data: {
        totalCostValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalCostValue,
        totalItems,
        totalProducts: products.length
      }
    });
  } catch (error) {
    console.error('Error al calcular valor de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular valor de inventario'
    });
  }
};

module.exports = {
  getMovements,
  createMovement,
  getLowStockProducts,
  getInventoryValue
};
