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
    name: 'create_sale',
    description: 'Crea una venta (registra detalles, deduce stock, crea movimientos y genera registro).',
    write: true,
    inputs: {
      customerId: 'number opcional',
      items: 'array requerido de { productId, quantity, unitPrice }',
      paymentMethod: 'string requerido (EJ: EFECTIVO, TARJETA, FIADO)',
      discount: 'number opcional'
    }
  },
  {
    name: 'create_product',
    description: 'Crea un producto en el inventario.',
    write: true,
    inputs: {
      name: 'string requerido',
      sku: 'string opcional',
      barcode: 'string opcional',
      costPrice: 'number requerido',
      salePrice: 'number requerido',
      stock: 'number opcional',
      minStock: 'number opcional',
      categoryId: 'number opcional',
      active: 'boolean opcional'
    }
  },
  {
    name: 'update_product',
    description: 'Actualiza campos de un producto existente.',
    write: true,
    inputs: {
      productId: 'number requerido',
      name: 'string opcional',
      sku: 'string opcional',
      barcode: 'string opcional',
      costPrice: 'number opcional',
      salePrice: 'number opcional',
      stock: 'number opcional',
      minStock: 'number opcional',
      categoryId: 'number opcional',
      active: 'boolean opcional'
    }
  },
  {
    name: 'delete_product',
    description: 'Desactiva o elimina un producto del inventario (soft-delete).',
    write: true,
    inputs: {
      productId: 'number requerido',
      hard: 'boolean opcional (si true elimina físicamente)'
    }
  },
  {
    name: 'update_customer',
    description: 'Actualiza datos de un cliente.',
    write: true,
    inputs: {
      customerId: 'number requerido',
      name: 'string opcional',
      phone: 'string opcional',
      email: 'string opcional',
      address: 'string opcional',
      rfc: 'string opcional'
    }
  },
  {
    name: 'delete_customer',
    description: 'Desactiva o elimina un cliente (soft-delete).',
    write: true,
    inputs: {
      customerId: 'number requerido',
      hard: 'boolean opcional'
    }
  },
  {
    name: 'list_accounts',
    description: 'Lista cuentas (cuentas por cobrar) con filtros opcionales.',
    write: false,
    inputs: {
      customerId: 'number opcional',
      limit: 'number opcional'
    }
  },
  {
    name: 'get_account',
    description: 'Obtiene detalle de una cuenta por id.',
    write: false,
    inputs: {
      accountId: 'number requerido'
    }
  },
  {
    name: 'update_account',
    description: 'Actualiza campos de una cuenta (balance, limite).',
    write: true,
    inputs: {
      accountId: 'number requerido',
      balance: 'number opcional (incrementa si se pasa delta?)',
      creditLimit: 'number opcional'
    }
  },
  {
    name: 'create_account_transaction',
    description: 'Registra una transacción en la cuenta (CARGO/ABONO).',
    write: true,
    inputs: {
      accountId: 'number requerido',
      type: 'CARGO | ABONO',
      amount: 'number requerido',
      description: 'string opcional'
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

const createSaleTool = async (input, context) => {
  const items = Array.isArray(input?.items) ? input.items : [];
  const customerId = input?.customerId ? parseInt(input.customerId, 10) : null;
  const paymentMethod = input?.paymentMethod ? String(input.paymentMethod) : null;
  const discount = input?.discount ? parseFloat(input.discount) : 0;

  if (!context?.userId) {
    throw new Error('Usuario no autenticado en el contexto.');
  }

  if (!items || items.length === 0) {
    throw new Error('La venta debe tener al menos un producto.');
  }

  // Verificar stock y calcular totales
  let subtotal = 0;
  const saleDetails = [];

  for (const item of items) {
    const productId = parseInt(item.productId, 10);
    const quantity = Number.parseFloat(item.quantity);

    if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Cada item debe incluir productId y quantity válidos.');
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error(`Producto con ID ${productId} no encontrado.`);
    }

    if (!product.active) {
      throw new Error(`El producto "${product.name}" está desactivado.`);
    }

    if (product.stock < quantity) {
      throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);
    }

    const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : parseFloat(product.salePrice);
    const itemSubtotal = unitPrice * quantity;
    subtotal += itemSubtotal;

    saleDetails.push({
      productId: product.id,
      quantity,
      unitPrice,
      subtotal: itemSubtotal
    });
  }

  const tax = subtotal * 0.16;
  const total = subtotal - parseFloat(discount || 0) + tax;

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        customerId: customerId || null,
        userId: context.userId,
        subtotal,
        discount: parseFloat(discount || 0),
        tax,
        total,
        paymentMethod,
        paid: paymentMethod !== 'FIADO',
        details: { create: saleDetails }
      },
      include: {
        customer: true,
        user: { select: { id: true, fullName: true } },
        details: { include: { product: true } }
      }
    });

    // Actualizar stock y movimientos
    for (const item of items) {
      await tx.product.update({
        where: { id: parseInt(item.productId, 10) },
        data: { stock: { decrement: item.quantity } }
      });

      await tx.inventoryMovement.create({
        data: {
          productId: parseInt(item.productId, 10),
          userId: context.userId,
          type: 'SALIDA',
          quantity: item.quantity,
          reason: `Venta #${newSale.id}`
        }
      });
    }

    // Manejo de fiado
    if (paymentMethod === 'FIADO' && customerId) {
      let account = await tx.account.findFirst({ where: { customerId: parseInt(customerId) } });

      if (!account) {
        account = await tx.account.create({ data: { customerId: parseInt(customerId), balance: 0, creditLimit: 5000 } });
      }

      if (parseFloat(account.balance) + total > parseFloat(account.creditLimit)) {
        throw new Error(`El cliente excede su límite de crédito. Límite: $${account.creditLimit}, Saldo actual: $${account.balance}`);
      }

      await tx.account.update({ where: { id: account.id }, data: { balance: { increment: total }, lastActivity: new Date() } });

      await tx.accountTransaction.create({ data: { accountId: account.id, userId: context.userId, type: 'CARGO', amount: total, description: `Venta #${newSale.id} a crédito` } });
    }

    return newSale;
  });

  return {
    success: true,
    message: 'Venta creada correctamente.',
    data: sale
  };
};

// Product CRUD
const createProduct = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const name = input?.name ? String(input.name).trim() : null;
  if (!name) throw new Error('El nombre del producto es requerido.');

  const product = await prisma.product.create({
    data: {
      name,
      sku: input?.sku ? String(input.sku) : null,
      barcode: input?.barcode ? String(input.barcode) : null,
      costPrice: input?.costPrice ? parseFloat(input.costPrice) : 0,
      salePrice: input?.salePrice ? parseFloat(input.salePrice) : 0,
      stock: input?.stock ? parseInt(input.stock, 10) : 0,
      minStock: input?.minStock ? parseInt(input.minStock, 10) : 0,
      categoryId: input?.categoryId ? parseInt(input.categoryId, 10) : null,
      active: typeof input?.active === 'boolean' ? input.active : true
    }
  });

  return { success: true, message: 'Producto creado.', data: product };
};

const updateProduct = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const productId = parseInt(input?.productId, 10);
  if (!Number.isFinite(productId)) throw new Error('productId invalido.');

  const updateData = {};
  if (input?.name) updateData.name = String(input.name);
  if (input?.sku) updateData.sku = String(input.sku);
  if (input?.barcode) updateData.barcode = String(input.barcode);
  if (input?.costPrice !== undefined) updateData.costPrice = parseFloat(input.costPrice);
  if (input?.salePrice !== undefined) updateData.salePrice = parseFloat(input.salePrice);
  if (input?.stock !== undefined) updateData.stock = parseInt(input.stock, 10);
  if (input?.minStock !== undefined) updateData.minStock = parseInt(input.minStock, 10);
  if (input?.categoryId !== undefined) updateData.categoryId = input.categoryId ? parseInt(input.categoryId, 10) : null;
  if (input?.active !== undefined) updateData.active = Boolean(input.active);

  const product = await prisma.product.update({ where: { id: productId }, data: updateData });
  return { success: true, message: 'Producto actualizado.', data: product };
};

const deleteProduct = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const productId = parseInt(input?.productId, 10);
  if (!Number.isFinite(productId)) throw new Error('productId invalido.');

  if (input?.hard) {
    await prisma.product.delete({ where: { id: productId } });
    return { success: true, message: 'Producto eliminado permanentemente.' };
  }

  const product = await prisma.product.update({ where: { id: productId }, data: { active: false } });
  return { success: true, message: 'Producto desactivado (soft-delete).', data: product };
};

// Customer CRUD
const updateCustomer = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const customerId = parseInt(input?.customerId, 10);
  if (!Number.isFinite(customerId)) throw new Error('customerId invalido.');

  const data = {};
  if (input?.name) data.name = String(input.name);
  if (input?.phone) data.phone = String(input.phone);
  if (input?.email) data.email = String(input.email);
  if (input?.address) data.address = String(input.address);
  if (input?.rfc) data.rfc = String(input.rfc);

  const customer = await prisma.customer.update({ where: { id: customerId }, data });
  return { success: true, message: 'Cliente actualizado.', data: customer };
};

const deleteCustomer = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const customerId = parseInt(input?.customerId, 10);
  if (!Number.isFinite(customerId)) throw new Error('customerId invalido.');

  if (input?.hard) {
    await prisma.customer.delete({ where: { id: customerId } });
    return { success: true, message: 'Cliente eliminado permanentemente.' };
  }

  const customer = await prisma.customer.update({ where: { id: customerId }, data: { active: false } });
  return { success: true, message: 'Cliente desactivado (soft-delete).', data: customer };
};

// Accounts and transactions
const listAccounts = async (input) => {
  const limit = clamp(input?.limit, 1, 100, 20);
  const where = {};
  if (input?.customerId) where.customerId = parseInt(input.customerId, 10);

  const accounts = await prisma.account.findMany({ where, take: limit, include: { customer: true } });
  return { success: true, data: accounts };
};

const getAccount = async (input) => {
  const accountId = parseInt(input?.accountId, 10);
  if (!Number.isFinite(accountId)) throw new Error('accountId invalido.');

  const account = await prisma.account.findUnique({ where: { id: accountId }, include: { customer: true, transactions: true } });
  return { success: true, data: account };
};

const updateAccount = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const accountId = parseInt(input?.accountId, 10);
  if (!Number.isFinite(accountId)) throw new Error('accountId invalido.');

  const data = {};
  if (input?.creditLimit !== undefined) data.creditLimit = parseFloat(input.creditLimit);
  if (input?.balance !== undefined) data.balance = parseFloat(input.balance);

  const account = await prisma.account.update({ where: { id: accountId }, data });
  return { success: true, message: 'Cuenta actualizada.', data: account };
};

const createAccountTransaction = async (input, context) => {
  if (!context?.userId) throw new Error('Usuario no autenticado en el contexto.');
  const accountId = parseInt(input?.accountId, 10);
  const type = String(input?.type || '').toUpperCase();
  const amount = parseFloat(input?.amount);
  if (!Number.isFinite(accountId) || !['CARGO', 'ABONO'].includes(type) || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Parametros invalidos para transaccion de cuenta.');
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Cuenta no encontrada.');

    const newBalance = type === 'CARGO' ? parseFloat(account.balance) + amount : parseFloat(account.balance) - amount;
    await tx.account.update({ where: { id: accountId }, data: { balance: newBalance, lastActivity: new Date() } });

    const transaction = await tx.accountTransaction.create({ data: { accountId, userId: context.userId, type, amount, description: input?.description ? String(input.description) : null } });
    return { account: await tx.account.findUnique({ where: { id: accountId } }), transaction };
  });

  return { success: true, message: 'Transaccion creada.', data: txResult };
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
    case 'create_sale':
      return createSaleTool(input, context);
    case 'create_product':
      return createProduct(input, context);
    case 'update_product':
      return updateProduct(input, context);
    case 'delete_product':
      return deleteProduct(input, context);
    case 'update_customer':
      return updateCustomer(input, context);
    case 'delete_customer':
      return deleteCustomer(input, context);
    case 'list_accounts':
      return listAccounts(input);
    case 'get_account':
      return getAccount(input);
    case 'update_account':
      return updateAccount(input, context);
    case 'create_account_transaction':
      return createAccountTransaction(input, context);
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
