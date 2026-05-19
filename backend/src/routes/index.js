const authRoutes = require('./auth.routes');
const productsRoutes = require('./products.routes');
const categoriesRoutes = require('./categories.routes');
const customersRoutes = require('./customers.routes');
const salesRoutes = require('./sales.routes');
const inventoryRoutes = require('./inventory.routes');
const accountsRoutes = require('./accounts.routes');
const chatbotRoutes = require('./chatbot.routes');
const passwordResetRoutes = require('./password-reset.routes');

module.exports = {
  authRoutes,
  productsRoutes,
  categoriesRoutes,
  customersRoutes,
  salesRoutes,
  inventoryRoutes,
  accountsRoutes,
  chatbotRoutes,
  passwordResetRoutes
};
