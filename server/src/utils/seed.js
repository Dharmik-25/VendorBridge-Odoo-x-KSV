const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed script...');

  // Clean existing database
  console.log('🧹 Cleaning existing tables...');
  await prisma.activityLog.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.poItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rfqVendor.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rFQ.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('👤 Seeding default users...');

  const commonPasswordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  // 1. Seed 2 Admins
  const admin1 = await prisma.user.create({
    data: {
      name: 'Super Admin One',
      email: 'admin1@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'admin',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Super Admin Two',
      email: 'admin2@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'admin',
    },
  });

  // 2. Seed 2 Procurement Officers
  const officer1 = await prisma.user.create({
    data: {
      name: 'Procurement Officer John',
      email: 'officer1@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'procurement_officer',
    },
  });

  const officer2 = await prisma.user.create({
    data: {
      name: 'Procurement Officer Alice',
      email: 'officer2@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'procurement_officer',
    },
  });

  // 3. Seed 1 Manager
  const manager = await prisma.user.create({
    data: {
      name: 'Manager Robert',
      email: 'manager1@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'manager',
    },
  });

  console.log('🏢 Seeding default vendors...');

  // 4. Seed 3 Vendors (Users + Vendor entities)
  const vendorUser1 = await prisma.user.create({
    data: {
      name: 'Acme IT Solutions',
      email: 'vendor1@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'vendor',
    },
  });

  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      name: 'Acme IT Solutions Private Limited',
      email: 'vendor1@vendorbridge.com',
      phone: '9876543210',
      category: 'IT',
      gstNumber: '27AAAAA1111A1Z1',
      country: 'India',
      status: 'approved',
      rating: 4.5,
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      name: 'Logistics Pro',
      email: 'vendor2@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'vendor',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      name: 'Logistics Pro India',
      email: 'vendor2@vendorbridge.com',
      phone: '9876543211',
      category: 'Logistics',
      gstNumber: '27BBBBB2222B2Z2',
      country: 'India',
      status: 'approved',
      rating: 4.2,
    },
  });

  const vendorUser3 = await prisma.user.create({
    data: {
      name: 'Office Decor & Co',
      email: 'vendor3@vendorbridge.com',
      passwordHash: commonPasswordHash,
      role: 'vendor',
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      userId: vendorUser3.id,
      name: 'Office Decor & Furniture Solutions',
      email: 'vendor3@vendorbridge.com',
      phone: '9876543212',
      category: 'Furniture',
      gstNumber: '27CCCCC3333C3Z3',
      country: 'India',
      status: 'approved',
      rating: 3.8,
    },
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Login credentials (password: "password123" for all):');
  console.log('  Admin 1:             admin1@vendorbridge.com');
  console.log('  Admin 2:             admin2@vendorbridge.com');
  console.log('  Officer 1:           officer1@vendorbridge.com');
  console.log('  Officer 2:           officer2@vendorbridge.com');
  console.log('  Manager:             manager1@vendorbridge.com');
  console.log('  Vendor 1 (IT):       vendor1@vendorbridge.com');
  console.log('  Vendor 2 (Logistics):vendor2@vendorbridge.com');
  console.log('  Vendor 3 (Furniture):vendor3@vendorbridge.com');
  console.log('----------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
