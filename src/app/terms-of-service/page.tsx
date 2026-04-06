export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white text-gray-900 border border-gray-100 rounded-xl my-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or using Rankved GMB Manager ("the Service"), operated by <a href="https://rankved.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Rankved Healthcare Martech Agency</a>, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Service Usage</h2>
          <p>
            The Service allows you to connect your Google Business Profile to schedule and manage posts. You agree to use the Service only for lawful purposes and in accordance with these Terms and all applicable Google APIs Terms of Service.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
            <li>You must be at least 18 years old to use the Service.</li>
            <li>You are responsible for safeguarding the password that you use to access the Service.</li>
            <li>You agree not to disclose your password to any third party.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data and Privacy</h2>
          <p>
            Our collection and use of personal information in connection with your access to and use of the Service is described in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Rankved and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Termination</h2>
          <p>
            We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
          <p>
            In no event shall Rankved Healthcare Martech Agency, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>

         <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="font-medium text-gray-900">Rankved Healthcare Martech Agency</p>
            <p className="text-gray-600 mt-1">
              Q-13 Shatabdipuram, Gwalior<br />
              M.P 477005, India
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-600">
                <span className="font-medium mr-2">Email:</span> 
                <a href="mailto:info@rankved.com" className="text-blue-600 hover:underline">info@rankved.com</a>
              </p>
              <p className="text-gray-600">
                <span className="font-medium mr-2">Website:</span> 
                <a href="https://rankved.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">rankved.com</a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
