require('dotenv').config();

const { getAgentReply } = require('../services/agent.service');

const runTest = async (msg) => {
  try {
    const result = await getAgentReply({ message: msg, history: [], allowWrite: false, userId: null, memorySummary: null });
    console.log('=== INPUT ===');
    console.log(msg);
    console.log('\n=== RESULT ===');
    console.log(result);
  } catch (err) {
    console.error('Test failed:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
};

const tests = [
  'necesito poner un estante de madera',
  'que materiales necesito para pintar una pared',
  'necesito instalar un interruptor y una toma de corriente'
];

(async () => {
  for (const t of tests) {
    // small delay between tests
    // eslint-disable-next-line no-await-in-loop
    await runTest(t);
  }
})();
