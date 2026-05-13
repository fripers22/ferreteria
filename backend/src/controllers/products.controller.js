const prisma = require('../config/database');

const getAllProducts = async (req, res) => {
  try {
    const { search, categoryId, active, lowStock } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });

    let result = products;

    if (lowStock === 'true') {
      result = products.filter(p => p.stock <= p.minStock);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al buscar por código de barras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar producto'
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { sku, barcode, name, description, categoryId, unit, costPrice, salePrice, stock, minStock } = req.body;

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: 'El SKU ya existe'
      });
    }

    if (barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode } });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: 'El código de barras ya existe'
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        sku,
        barcode: barcode || null,
        name,
        description,
        categoryId: parseInt(categoryId),
        unit: unit || 'pza',
        costPrice: parseFloat(costPrice),
        salePrice: parseFloat(salePrice),
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 5
      },
      include: { category: true }
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, barcode, name, description, categoryId, unit, costPrice, salePrice, stock, minStock, active } = req.body;

    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'El SKU ya existe'
        });
      }
    }

    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode } });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: 'El código de barras ya existe'
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(unit && { unit }),
        ...(costPrice && { costPrice: parseFloat(costPrice) }),
        ...(salePrice && { salePrice: parseFloat(salePrice) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(active !== undefined && { active })
      },
      include: { category: true }
    });

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: updated
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { active: false }
    });

    res.json({
      success: true,
      message: 'Producto desactivado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
};
