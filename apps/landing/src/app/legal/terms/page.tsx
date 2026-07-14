export default function TermsOfService() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-zinc-800 pb-8 mb-4">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Terms of Service</h1>
        <p className="text-zinc-500">Last Updated: March 15, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Introduction</h2>
        <p className="leading-relaxed">
          These Terms of Service constitute a legally binding agreement made between you and Aura Proxy,
          concerning your access to and use of our AI Gateway services and website.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">User Obligations</h2>
        <p className="leading-relaxed">
          By using our services, you agree that:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
          <li>You will not use the service for any illegal or unauthorized purpose.</li>
          <li>You are responsible for safeguarding the credentials and API keys you use.</li>
          <li>You will not attempt to bypass our rate limits or abuse our caching systems.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Intellectual Property Rights</h2>
        <p className="leading-relaxed">
          Our service and its original content, features, and functionality are owned by Aura Proxy and are 
          protected by international copyright, trademark, patent, trade secret, and other intellectual property 
          or proprietary rights laws. As an open-source tool, portions of our codebase may be licensed under MIT or other permissive licenses.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-200">Contact</h2>
        <p className="leading-relaxed">
          If you have questions or comments about our Terms of Service, please contact us at:
          <br />
          <a href="mailto:legal@auraproxy.dev" className="text-purple-400 hover:text-purple-300 underline mt-2 inline-block">legal@auraproxy.dev</a>
        </p>
      </section>
    </div>
  );
}
