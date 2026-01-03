
import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();

async function describeUsers() {
    try {
        console.log('--- DESCRIBING users TABLE ---');
        const columns = await prisma.$queryRaw`DESCRIBE users`;
        console.table(columns);
    } catch (error) {
        console.error('Error describing users table:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

describeUsers();
