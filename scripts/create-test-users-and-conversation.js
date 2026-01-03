import { PrismaClient } from '../generated/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const requireEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const JWT_SECRET = requireEnv('JWT_SECRET');
const SCHOOL_ID = 1n; // Change if needed

async function createTestUsersAndConversation() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('TestPassword!123', 10);
        
        // 1. Create two new users with SUPER_ADMIN role
        const userA = await prisma.user.create({
            data: {
                firstName: 'TestA',
                lastName: 'UserA',
                email: `testa_${Date.now()}@example.com`,
                username: `testa_${Date.now()}`,
                role: 'SUPER_ADMIN',
                school: { connect: { id: 1 } },
                password: hashedPassword,
                createdByOwner: { connect: { id: 2 } }
            }
        });
        const userB = await prisma.user.create({
            data: {
                firstName: 'TestB',
                lastName: 'UserB',
                email: `testb_${Date.now()}@example.com`,
                username: `testb_${Date.now()}`,
                role: 'SUPER_ADMIN',
                school: { connect: { id: 1 } },
                password: hashedPassword,
                createdByOwner: { connect: { id: 2 } }
            }
        });

        // 2. Create a DIRECT conversation between them
        const conversation = await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                schoolId: SCHOOL_ID,
                createdBy: userA.id,
                participants: {
                    create: [
                        {
                            userId: userA.id,
                            role: 'MEMBER',
                            schoolId: SCHOOL_ID,
                            createdBy: userA.id,
                            isActive: true
                        },
                        {
                            userId: userB.id,
                            role: 'MEMBER',
                            schoolId: SCHOOL_ID,
                            createdBy: userA.id,
                            isActive: true
                        }
                    ]
                }
            }
        });

        // 3. Generate JWT tokens for both users
        const tokenA = jwt.sign({
            userId: userA.id.toString(),
            email: userA.email,
            role: userA.role,
            name: `${userA.firstName} ${userA.lastName}`
        }, JWT_SECRET, { expiresIn: '1d' });
        const tokenB = jwt.sign({
            userId: userB.id.toString(),
            email: userB.email,
            role: userB.role,
            name: `${userB.firstName} ${userB.lastName}`
        }, JWT_SECRET, { expiresIn: '1d' });

        // 4. Print info for testing
        console.log('✅ Created two test users and a conversation!');
        console.log('User A:', userA.id.toString(), userA.email, userA.role);
        console.log('User B:', userB.id.toString(), userB.email, userB.role);
        console.log('Conversation ID:', conversation.id.toString());
        console.log('\nJWT Token A:', tokenA);
        console.log('\nJWT Token B:', tokenB);
        console.log('\nUse these tokens and conversation ID in your frontend or test scripts!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsersAndConversation(); 