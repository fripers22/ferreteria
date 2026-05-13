const prisma = require('../config/database');

const getAllAccounts = async (req, res) => {
  try {
    const { hasBalance } = req.query;

    const where = {};
    if (hasBalance === 'true') {
      where.balance = { gt: 0 };
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        customer: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { lastActivity: 'desc' }
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas'
    });
  }
};

const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        transactions: {
          include: {
            user: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta'
    });
  }
};

const getAccountByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    let account = await prisma.account.findFirst({
      where: { customerId: parseInt(customerId) },
      include: {
        customer: true,
        transactions: {
          include: {
            user: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!account) {
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(customerId) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      account = await prisma.account.create({
        data: {
          customerId: parseInt(customerId),
          balance: 0,
          creditLimit: 5000
        },
        include: {
          customer: true,
          transactions: true
        }
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error al obtener cuenta del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta del cliente'
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;
    const userId = req.user.userId;

    const account = await prisma.account.findUnique({
      where: { id: parseInt(accountId) }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (parseFloat(amount) > parseFloat(account.balance)) {
      return res.status(400).json({
        success: false,
        message: `El abono ($${amount}) excede el saldo pendiente ($${account.balance})`
      });
    }

    const [transaction] = await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId: parseInt(accountId),
          userId,
          type: 'ABONO',
          amount: parseFloat(amount),
          description: description || 'Abono a cuenta'
        },
        include: {
          account: { include: { customer: true } },
          user: { select: { fullName: true } }
        }
      }),
      prisma.account.update({
        where: { id: parseInt(accountId) },
        data: {
          balance: { decrement: parseFloat(amount) },
          lastActivity: new Date()
        }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Abono registrado correctamente',
      data: transaction
    });
  } catch (error) {
    console.error('Error al registrar abono:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar abono'
    });
  }
};

const updateCreditLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { creditLimit } = req.body;

    const account = await prisma.account.update({
      where: { id: parseInt(id) },
      data: { creditLimit: parseFloat(creditLimit) },
      include: { customer: true }
    });

    res.json({
      success: true,
      message: 'Límite de crédito actualizado',
      data: account
    });
  } catch (error) {
    console.error('Error al actualizar límite de crédito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar límite de crédito'
    });
  }
};

const getAccountsSummary = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { balance: { gt: 0 } },
      include: { customer: true }
    });

    const totalPending = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.balance),
      0
    );

    const totalCreditLimit = await prisma.account.aggregate({
      _sum: { creditLimit: true }
    });

    res.json({
      success: true,
      data: {
        totalPending,
        accountsWithBalance: accounts.length,
        totalCreditLimit: parseFloat(totalCreditLimit._sum.creditLimit || 0),
        accounts
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de cuentas'
    });
  }
};

module.exports = {
  getAllAccounts,
  getAccountById,
  getAccountByCustomerId,
  createPayment,
  updateCreditLimit,
  getAccountsSummary
};
