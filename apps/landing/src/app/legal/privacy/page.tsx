export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-zinc-800 pb-8 mb-4">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Privacy Policy</h1>
        <p className="text-zinc-500">Last Updated: March 15, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Introduction</h2>
        <p className="leading-relaxed">
          At Aura Proxy, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
          disclose, and safeguard your information when you visit our website and use our AI Gateway services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Information We Collect</h2>
        <p className="leading-relaxed">
          We may collect information about you in a variety of ways. The information we may collect includes:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
          <li>Personal Data (such as name and email address when you register)</li>
          <li>Usage Data (API calls, latency, and routing analytics)</li>
          <li>Device and Connection Information (IP address, browser type)</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">How We Use Your Information</h2>
        <p className="leading-relaxed">
          Having accurate information about you permits us to provide you with a smooth, efficient, and 
          customized experience. Specifically, we may use information collected about you to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
          <li>Provide, operate, and maintain our AI Gateway</li>
          <li>Improve routing algorithms and semantic caching</li>
          <li>Monitor and analyze usage and trends to improve your experience</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Contact</h2>
        <p className="leading-relaxed">
          If you have questions or comments about this Privacy Policy, please contact us at:
          <br />
          <a href="mailto:privacy@auraproxy.dev" className="text-purple-400 hover:text-purple-300 underline mt-2 inline-block">privacy@auraproxy.dev</a>
        </p>
      </section>
    </div>
  );
}
