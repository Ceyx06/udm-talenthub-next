const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('password', 10);
  
  console.log('Updating HR user...');
  const hrUser = await prisma.user.update({
    where: { email: 'hr@udm.edu.ph' },
    data: {
      password: hashedPassword,
      role: 'HR',
    },
  });
  console.log('✅ HR user updated:', hrUser.email, hrUser.role);
  
  console.log('Updating Dean user...');
  const deanUser = await prisma.user.update({
    where: { email: 'dean@udm.edu.ph' },
    data: {
      password: hashedPassword,
      role: 'DEAN',
    },
  });
  console.log('✅ Dean user updated:', deanUser.email, deanUser.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());