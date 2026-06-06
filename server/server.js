require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 VendorBridge Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   API Base:    http://localhost:${PORT}/api/v1\n`);
});
