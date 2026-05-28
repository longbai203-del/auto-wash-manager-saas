const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 创建服务
  const services = [
    { name: '基础洗车', price: 30, duration: 30, category: '洗车' },
    { name: '精洗', price: 60, duration: 60, category: '洗车' },
    { name: '打蜡', price: 100, duration: 45, category: '美容' },
    { name: '内饰清洁', price: 150, duration: 90, category: '内饰' }
  ];
  
  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name },
      update: {},
      create: service
    });
  }
  console.log('✅ 服务数据已初始化');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
