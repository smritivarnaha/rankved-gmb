const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsage() {
  try {
    const postCount = await prisma.post.count();
    
    // Query to get database size in MB
    const dbSize = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
    
    console.log(`\n--- Supabase Usage Report ---`);
    console.log(`Total Posts in DB: ${postCount}`);
    console.log(`Current Database Size: ${dbSize[0].size}`);
    
    // Estimating storage (assuming avg 2MB per post with image)
    const estimatedStorage = (postCount * 2).toFixed(2);
    console.log(`Estimated Image Storage Used: ~${estimatedStorage} MB`);
    console.log(`Free Tier Limit: 1,000 MB (1GB)`);
    console.log(`Remaining Image Space: ~${(1000 - postCount * 2).toFixed(2)} MB`);
    console.log(`-----------------------------\n`);

  } catch (err) {
    console.error('Error checking usage:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsage();
