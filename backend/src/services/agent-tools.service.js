const prisma = require('../config/database');

const TOOL_DEFS = [
  {
    name: 'list_low_stock',
    description: 'Lista productos activos con stock por debajo de su minimo.',
    write: false,
    inputs: {
      limit: 'number opcional (max 50)'
    }
  },
  {
    name: 'get_daily_sales_summary',
    description: 'Resumen de ventas del dia (o de una fecha dada).',
    write: false,
    inputs: {
      date: 'string opcional YYYY-MM-DD'
    }
  },
  {
    name: 'find_product',
    description: 'Busca productos por sku, codigo de barras o nombre.',
    write: false,
    inputs: {
      query: 'string opcional (nombre, sku o barcode)',
      sku: 'string opcional',
      barcode: 'string opcional',
      name: 'string opcional',
      limit: 'number opcional (max 20)'
    }
  },
  {
    name: 'list_inventory',
    description: 'Lista productos activos del inventario con stock, precios y categoria.',
    write: false,
    inputs: {
      search: 'string opcional para filtrar por nombre, sku o codigo de barras',
      limit: 'number opcional (max 50)'
    }
  },
  {
    name: 'list_customers',
    description: 'Lista clientes con busqueda opcional por nombre, telefono o email.',
    write: false,
    inputs: {
      search: 'string opcional',
      limit: 'number opcional (max 50)'
    }
  },
  {
    name: 'get_inventory_value',
    description: 'Obtiene resumen del valor del inventario.',
    write: false,
    inputs: {}
  },
  {
    name: 'create_customer',
    description: 'Crea un cliente nuevo en el sistema.',
    write: true,
    inputs: {
      name: 'string requerido',
      phone: 'string opcional',
      email: 'string opcional',
      address: 'string opcional',
      rfc: 'string opcional'
    }
  },
  {
    name: 'create_inventory_movement',
    description: 'Registra un movimiento de inventario y actualiza stock.',
    write: true,
    inputs: {
      productId: 'number opcional',
      sku: 'string opcional',
      barcode: 'string opcional',
      name: 'string opcional',
      type: 'ENTRADA | SALIDA | AJUSTE',
      quantity: 'number requerido',
      reason: 'string opcional'
    }
  },
  {
    name: 'build_cart_estimate',
    description: 'Genera un carrito estimado con precios desde el inventario (no guarda venta).',
    write: false,
    inputs: {
      items: 'array requerido de { query o sku o barcode o name, quantity }',
      limit: 'number opcional (max 5 candidatos por item)'
    }
  }
];

const clamp = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
};

const resolveProduct = async ({ productId, sku, barcode, name }) => {
  if (productId) {
    return prisma.product.findUnique({ where: { id: parseInt(productId, 10) } });
  }

  if (sku) {
    return prisma.product.findUnique({ where: { sku: String(sku) } });
  }

  if (barcode) {
    return prisma.product.findUnique({ where: { barcode: String(barcode) } });
  }

  if (name) {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: String(name), mode: 'insensitive' }
      },
      take: 2
    });

    if (products.length === 1) {
      return products[0];
    }

    if (products.length > 1) {
      throw new Error('Se encontraron multiples productos con ese nombre. Usa SKU o codigo de barras.');
    }
  }

  return null;
};

const listLowStock = async (input) => {
  const limit = clamp(input?.limit, 1, 50, 10);

  const rows = await prisma.$queryRaw`
    SELECT p.*, c.name as "categoryName"
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.active = true AND p.stock <= p."minStock"
    ORDER BY p.stock ASC
    LIMIT ${limit}
  `;

  return {
    success: true,
    data: rows
  };
};

const getDailySalesSummary = async (input) => {
  const dateStr = input?.date ? String(input.date) : null;
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: date,
        lt: nextDate
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

  return {
    success: true,
    data: {
      summary: {
        totalSales,
        totalTransactions,
        averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      sales: sales.slice(0, 10)
    }
  };
};

const findProduct = async (input) => {
  const limit = clamp(input?.limit, 1, 20, 10);
  const sku = input?.sku;
  const barcode = input?.barcode;
  const name = input?.name;
  const query = input?.query;

  if (sku || barcode) {
    const product = await prisma.product.findUnique({
      where: sku ? { sku: String(sku) } : { barcode: String(barcode) },
      include: { category: true }
    });

    return {
      success: true,
      data: product ? [product] : []
    };
  }

  const search = name || query;
  if (!search) {
    throw new Error('Debes indicar un criterio de busqueda.');
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { barcode: { contains: String(search), mode: 'insensitive' } }
      ]
    },
    include: { category: true },
    take: limit,
    orderBy: { name: 'asc' }
  });

  return {
    success: true,
    data: products
  };
};

const listInventory = async (input) => {
  const limit = clamp(input?.limit, 1, 50, 20);
  const search = input?.search ? String(input.search).trim() : null;

  const where = { active: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } }
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [{ name: 'asc' }],
    take: limit
  });

  return {
    success: true,
    data: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      stock: product.stock,
      minStock: product.minStock,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      active: product.active,
      category: product.category ? { id: product.category.id, name: product.category.name } : null
    }))
  };
};

const listCustomers = async (input) => {
  const limit = clamp(input?.limit, 1, 50, 10);
  const search = input?.search ? String(input.search) : null;

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
      _count: { select: { sales: true } }
    },
    orderBy: { name: 'asc' },
    take: limit
  });

  return {
    success: true,
    data: customers
  };
};

const getInventoryValue = async () => {
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
    (sum, p) => sum + parseFloat(p.costPrice) * p.stock,
    0
  );

  const totalSaleValue = products.reduce(
    (sum, p) => sum + parseFloat(p.salePrice) * p.stock,
    0
  );

  return {
    success: true,
    data: {
      totalCostValue,
      totalSaleValue,
      potentialProfit: totalSaleValue - totalCostValue,
      totalItems: products.reduce((sum, p) => sum + p.stock, 0),
      totalProducts: products.length
    }
  };
};

const createCustomer = async (input) => {
  const name = input?.name ? String(input.name).trim() : '';
  if (!name) {
    throw new Error('El nombre del cliente es requerido.');
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone: input?.phone ? String(input.phone) : null,
      email: input?.email ? String(input.email) : null,
      address: input?.address ? String(input.address) : null,
      rfc: input?.rfc ? String(input.rfc) : null
    }
  });

  return {
    success: true,
    message: 'Cliente creado correctamente.',
    data: customer
  };
};

const createInventoryMovement = async (input, context) => {
  const product = await resolveProduct(input || {});
  if (!product) {
    throw new Error('Producto no encontrado. Usa productId, sku o barcode.');
  }

  const type = String(input?.type || '').toUpperCase();
  if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(type)) {
    throw new Error('Tipo de movimiento invalido. Usa ENTRADA, SALIDA o AJUSTE.');
  }

  const quantity = Number.parseInt(input?.quantity, 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La cantidad debe ser un numero mayor a 0.');
  }

  if (!context?.userId) {
    throw new Error('No se encontro el usuario para registrar el movimiento.');
  }

  if (type === 'SALIDA' && product.stock < quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${product.stock}.`);
  }

  let newStock = product.stock;
  if (type === 'ENTRADA') {
    newStock += quantity;
  } else if (type === 'SALIDA') {
    newStock -= quantity;
  } else if (type === 'AJUSTE') {
    newStock = quantity;
  }

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        userId: context.userId,
        type,
        quantity,
        reason: input?.reason ? String(input.reason) : null
      },
      include: {
        product: true,
        user: { select: { fullName: true } }
      }
    }),
    prisma.product.update({
      where: { id: product.id },
      data: { stock: newStock }
    })
  ]);

  return {
    success: true,
    message: 'Movimiento registrado correctamente.',
    data: movement
  };
};

const buildCartEstimate = async (input) => {
  const items = Array.isArray(input?.items) ? input.items : [];
  const limit = clamp(input?.limit, 1, 5, 3);

  if (items.length === 0) {
    throw new Error('Debes enviar items para generar el carrito.');
  }

  const cart = [];
  const needsSelection = [];
  const missing = [];
  let total = 0;

  for (const item of items) {
    const quantity = Number.parseFloat(item?.quantity);
    const query = item?.query || item?.name;
    const sku = item?.sku;
    const barcode = item?.barcode;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      missing.push({ query: query || sku || barcode || 'item', reason: 'Cantidad invalida.' });
      continue;
    }

    if (sku || barcode) {
      const product = await prisma.product.findUnique({
        where: sku ? { sku: String(sku) } : { barcode: String(barcode) },
        include: { category: true }
      });

      if (!product) {
        missing.push({ query: sku || barcode, quantity });
        continue;
      }

      const lineTotal = parseFloat(product.salePrice) * quantity;
      total += lineTotal;

      cart.push({
        query: sku || barcode,
        quantity,
        product,
        lineTotal,
        status: 'matched'
      });
      continue;
    }

    if (!query) {
      missing.push({ query: 'item', quantity, reason: 'Sin criterio de busqueda.' });
      continue;
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: String(query), mode: 'insensitive' } },
          { sku: { contains: String(query), mode: 'insensitive' } },
          { barcode: { contains: String(query), mode: 'insensitive' } }
        ]
      },
      include: { category: true },
      take: limit,
      orderBy: { name: 'asc' }
    });

    if (products.length === 0) {
      missing.push({ query, quantity });
      continue;
    }

    if (products.length === 1) {
      const product = products[0];
      const lineTotal = parseFloat(product.salePrice) * quantity;
      total += lineTotal;

      cart.push({
        query,
        quantity,
        product,
        lineTotal,
        status: 'matched'
      });
      continue;
    }

    needsSelection.push({
      query,
      quantity,
      candidates: products
    });
  }

  return {
    success: true,
    data: {
      cart,
      needsSelection,
      missing,
      total
    }
  };
};

const executeTool = async (toolName, input, context) => {
  switch (toolName) {
    case 'list_low_stock':
      return listLowStock(input);
    case 'get_daily_sales_summary':
      return getDailySalesSummary(input);
    case 'find_product':
      return findProduct(input);
    case 'list_inventory':
      return listInventory(input);
    case 'list_customers':
      return listCustomers(input);
    case 'get_inventory_value':
      return getInventoryValue();
    case 'create_customer':
      return createCustomer(input);
    case 'create_inventory_movement':
      return createInventoryMovement(input, context);
    case 'build_cart_estimate':
      return buildCartEstimate(input);
    default:
      throw new Error('Herramienta no soportada.');
  }
};

module.exports = {
  TOOL_DEFS,
  executeTool
};
