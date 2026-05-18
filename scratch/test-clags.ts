import 'dotenv/config';
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://gduuiekkfunekhocjeoc.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-key";
import { getGoogleAccessTokenForLocation } from '../src/lib/google-token';
import { publishToGBP } from '../src/lib/gbp-publisher';
import prisma from '../src/lib/prisma';

async function testPublish() {
  const locationId = "099e1fad-9f64-4959-aa0a-1a4f08c1d24a";
  const accessToken = await getGoogleAccessTokenForLocation(locationId);

  if (!accessToken) {
    console.log("No access token!");
    return;
  }

  console.log("Got access token");

  // Test 4: EXACT DB POST
  const dbPost = await prisma.post.findUnique({
    where: { id: 'cmp2fkl0q0002i9040ha6357m' }
  });

  if (!dbPost) return;

  const exactPost = {
    profileId: locationId,
    summary: dbPost.summary,
    topicType: dbPost.topicType as any,
    ctaType: dbPost.ctaType,
    ctaUrl: dbPost.ctaUrl,
  };

  console.log("--- TEST 4: EXACT DB POST ---");
  const res4 = await publishToGBP({ 
    post: exactPost as any, 
    accessToken, 
    imageDataUri: dbPost.mediaUrl
  });
  console.log("Exact DB result:", res4);
}

testPublish().catch(console.error);
