const prisma = require('../config/database');
const PDFDocument = require('pdfkit');

const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(Number(value || 0));

const streamSalePdf = (res, sale) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="venta-${sale.id}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const contentWidth = pageWidth;

  doc
    .fillColor('#1d4ed8')
    .fontSize(20)
    .text('FerreSync', { align: 'center' });

  doc
    .moveDown(0.3)
    .fillColor('#111827')
    .fontSize(14)
    .text('Comprobante de Venta', { align: 'center' });

  doc
    .moveDown(0.8)
    .fontSize(10)
    .fillColor('#374151')
    .text(`Venta #${sale.id}   |   Fecha: ${new Date(sale.createdAt).toLocaleString('es-MX')}`, {
      width: contentWidth,
      align: 'left'
    });

  doc
    .moveDown(0.3)
    .text(`Proveedor / Tienda: FerreSync`, { width: contentWidth })
    .text(`Vendedor: ${sale.user?.fullName || 'N/D'}`, { width: contentWidth })
    .text(`Cliente: ${sale.customer?.name || 'Cliente general'}`, { width: contentWidth })
    .text(`Método de pago: ${sale.paymentMethod}`, { width: contentWidth })
    .text(`Estado: ${sale.paid ? 'Pagada' : 'Pendiente / FIADO'}`, { width: contentWidth });

  doc.moveDown(0.8);
  doc
    .fillColor('#111827')
    .fontSize(12)
    .text('Detalle de productos', { underline: true });

  const tableTop = doc.y + 10;
  const col = {
    qty: 50,
    name: 210,
    price: 80,
    subtotal: 90,
    right: contentWidth - 50
  };

  doc
    .fontSize(10)
    .fillColor('#374151')
    .text('Cant.', 50, tableTop)
    .text('Producto', 100, tableTop)
    .text('P. Unit.', 320, tableTop)
    .text('Subtotal', 400, tableTop, { width: 120, align: 'right' });

  doc.moveTo(50, tableTop + 15).lineTo(col.right, tableTop + 15).strokeColor('#d1d5db').stroke();

  let y = tableTop + 22;
  sale.details.forEach((item) => {
    const name = item.product?.name || 'Producto';
    doc
      .fillColor('#111827')
      .text(String(item.quantity), 50, y)
      .text(name, 100, y, { width: 210 })
      .text(formatCurrency(item.unitPrice), 320, y, { width: 80, align: 'right' })
      .text(formatCurrency(item.subtotal), 400, y, { width: 120, align: 'right' });
    y += 22;

    if (y > 720) {
      doc.addPage();
      y = 60;
    }
  });

  y += 10;
  doc.moveTo(280, y).lineTo(col.right, y).strokeColor('#d1d5db').stroke();
  y += 15;

  doc
    .fontSize(11)
    .fillColor('#111827')
    .text(`Subtotal: ${formatCurrency(sale.subtotal)}`, 280, y, { width: 180, align: 'right' });
  y += 18;
  doc.text(`Descuento: ${formatCurrency(sale.discount)}`, 280, y, { width: 180, align: 'right' });
  y += 18;
  doc.text(`IVA (16%): ${formatCurrency(sale.tax)}`, 280, y, { width: 180, align: 'right' });
  y += 22;

  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text(`TOTAL: ${formatCurrency(sale.total)}`, 280, y, { width: 180, align: 'right' });

  doc
    .moveDown(2)
    .fontSize(9)
    .fillColor('#6b7280')
    .text('Documento generado automáticamente por FerreSync.', { align: 'center' });

  doc.end();
};

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

const getSalePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        user: { select: { id: true, fullName: true } },
        details: { include: { product: true } }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    return streamSalePdf(res, sale);
  } catch (error) {
    console.error('Error al generar PDF de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF de venta'
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
  getSalePdf,
  createSale,
  cancelSale,
  getDailySales
};
