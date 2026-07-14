export default function CookiePolicy() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-zinc-800 pb-8 mb-4">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Cookie Policy</h1>
        <p className="text-zinc-500">Last Updated: March 15, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Introduction</h2>
        <p className="leading-relaxed">
          This Cookie Policy explains how Aura Proxy uses cookies and similar technologies to recognize you when you visit our website. 
          It explains what these technologies are and why we use them.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">What are cookies?</h2>
        <p className="leading-relaxed">
          Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
          We use essential cookies to enable core functionality such as security, network management, and accessibility.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">How we use cookies</h2>
        <p className="leading-relaxed">
          We use cookies for the following purposes:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
          <li><strong>Essential Cookies:</strong> Required to provide you with services available through our website and to use some of its features, such as authentication sessions.</li>
          <li><strong>Analytics Cookies:</strong> Used to understand how visitors interact with our website to improve user experience.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Contact</h2>
        <p className="leading-relaxed">
          If you have questions about our use of cookies, please contact us at:
          <br />
          <a href="mailto:privacy@auraproxy.dev" className="text-purple-400 hover:text-purple-300 underline mt-2 inline-block">privacy@auraproxy.dev</a>
        </p>
      </section>
    </div>
  );
}
