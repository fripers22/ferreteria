import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }
};

export const productsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByBarcode: async (barcode) => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export const categoriesService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  create: async (name) => {
    const response = await api.post('/categories', { name });
    return response.data;
  },

  update: async (id, name) => {
    const response = await api.put(`/categories/${id}`, { name });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

export const customersService = {
  getAll: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export const salesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  getDaily: async () => {
    const response = await api.get('/sales/daily');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  getPdf: async (id) => {
    const response = await api.get(`/sales/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  }
};

export const inventoryService = {
  getMovements: async (params = {}) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  createMovement: async (data) => {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  getValue: async () => {
    const response = await api.get('/inventory/value');
    return response.data;
  }
};

export const accountsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/accounts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  getByCustomerId: async (customerId) => {
    const response = await api.get(`/accounts/customer/${customerId}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/accounts/summary');
    return response.data;
  },

  createPayment: async (accountId, amount, description) => {
    const response = await api.post('/accounts/payment', { accountId, amount, description });
    return response.data;
  },

  updateCreditLimit: async (id, creditLimit) => {
    const response = await api.put(`/accounts/${id}/credit-limit`, { creditLimit });
    return response.data;
  }
};

export const chatbotService = {
  sendMessage: async ({ message, history = [], allowWrite = false, sessionId } = {}) => {
    const payload = {
      message,
      history,
      allowWrite: Boolean(allowWrite)
    };

    if (sessionId) {
      payload.sessionId = sessionId;
    }

    const response = await api.post('/chatbot', payload);
    return response.data;
  },

  getSession: async (sessionId, limit = 50) => {
    const response = await api.get(`/chatbot/session/${sessionId}`, { params: { limit } });
    return response.data;
  },

  sendFeedback: async ({ sessionId, messageId, rating, note }) => {
    const response = await api.post('/chatbot/feedback', {
      sessionId,
      messageId,
      rating,
      note
    });
    return response.data;
  }
};
