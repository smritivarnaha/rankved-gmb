import 'dotenv/config';
import { getGoogleAccessTokenForLocation } from '../src/lib/google-token';

async function deletePosts() {
  const locationId = "099e1fad-9f64-4959-aa0a-1a4f08c1d24a";
  const accessToken = await getGoogleAccessTokenForLocation(locationId);

  const postsToDelete = [
    'accounts/103802222035622991626/locations/4729832011721845069/localPosts/3727431017122444764',
    'accounts/103802222035622991626/locations/4729832011721845069/localPosts/2540791080769802293',
    'accounts/103802222035622991626/locations/4729832011721845069/localPosts/9155396878388986764'
  ];

  for (const post of postsToDelete) {
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${post}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`Deleted ${post}: ${res.status}`);
  }
}

deletePosts().catch(console.error);
