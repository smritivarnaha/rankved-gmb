export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white text-gray-900 border border-gray-100 rounded-xl my-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            Welcome to Rankved GMB Manager ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us. This may include names, email addresses, usernames, and passwords.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Google Data</h2>
          <p>
            Our application connects to the Google Business Profile API to facilitate the management and scheduling of posts to your connected business profiles. We access, use, store, and share Google user data solely to provide this functionality. The data we retrieve from Google (e.g., business locations, post history, media) is securely stored and uniquely tied to your account. We do not sell this data to third parties.
          </p>
          <p className="mt-2">
            Our use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p>
            We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law. Once you delete your account, we will delete or anonymize your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us at your designated support email address.
          </p>
        </section>
      </div>
    </div>
  );
}
