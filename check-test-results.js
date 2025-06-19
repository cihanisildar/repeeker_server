const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestResults() {
  try {
    console.log('Checking for test results...');
    
    // Get all test results
    const testResults = await prisma.testResult.findMany({
      include: {
        session: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        card: {
          select: {
            id: true,
            word: true,
            definition: true,
          },
        },
      },
    });

    console.log(`Found ${testResults.length} test results:`);
    
    testResults.forEach((result, index) => {
      console.log(`\nResult ${index + 1}:`);
      console.log(`  ID: ${result.id}`);
      console.log(`  Session ID: ${result.sessionId}`);
      console.log(`  User: ${result.session.user.email}`);
      console.log(`  Card: "${result.card.word}" - ${result.card.definition}`);
      console.log(`  Correct: ${result.isCorrect}`);
      console.log(`  Time Spent: ${result.timeSpent}ms`);
      console.log(`  Created: ${result.createdAt}`);
    });

    // Check test sessions again
    console.log('\n\nChecking test sessions again...');
    const testSessions = await prisma.testSession.findMany({
      include: {
        results: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${testSessions.length} test sessions:`);
    
    testSessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  User: ${session.user.email}`);
      console.log(`  Created: ${session.createdAt}`);
      console.log(`  Results Count: ${session.results.length}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestResults(); 