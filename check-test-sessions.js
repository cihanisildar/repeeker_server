const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestSessions() {
  try {
    console.log('Checking for test sessions...');
    
    // Get all test sessions
    const testSessions = await prisma.testSession.findMany({
      include: {
        results: {
          include: {
            card: true,
          },
        },
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
      console.log(`  User: ${session.user.email} (${session.user.id})`);
      console.log(`  Created: ${session.createdAt}`);
      console.log(`  Results: ${session.results.length}`);
      
      session.results.forEach((result, resultIndex) => {
        console.log(`    Result ${resultIndex + 1}: Card "${result.card.word}" - ${result.isCorrect ? 'Correct' : 'Incorrect'} (${result.timeSpent}ms)`);
      });
    });

    // Also check review sessions
    console.log('\n\nChecking for review sessions...');
    const reviewSessions = await prisma.reviewSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${reviewSessions.length} review sessions:`);
    
    reviewSessions.forEach((session, index) => {
      console.log(`\nReview Session ${index + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  User: ${session.user.email} (${session.user.id})`);
      console.log(`  Mode: ${session.mode}`);
      console.log(`  Started: ${session.startedAt}`);
      console.log(`  Completed: ${session.completedAt}`);
      console.log(`  Cards: ${Array.isArray(session.cards) ? session.cards.length : 'Not an array'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestSessions(); 