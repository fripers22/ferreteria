const prisma = require('../config/database');

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'La categoría ya existe'
      });
    }

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
      data: category
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id: parseInt(id) }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otra categoría con ese nombre'
      });
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: category
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const productsCount = await prisma.product.count({
      where: { categoryId: parseInt(id) }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productsCount} productos asociados`
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
