const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');

connectDB().then(() => {
  seedAdminUser();
});

const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
         console.warn('Skipping admin seed: ADMIN_USERNAME or ADMIN_PASSWORD missing in env.');
         return;
      }
      
      await User.create({
        username: env.ADMIN_USERNAME,
        password: env.ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log(`\n======================================================`);
      console.log(`SEED SUCCESS: Admin user created.`);
      console.log(`Username: ${env.ADMIN_USERNAME}`);
      console.log(`======================================================\n`);
    } else {
      console.log('Database already has admin user(s). Skipping seeding.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
