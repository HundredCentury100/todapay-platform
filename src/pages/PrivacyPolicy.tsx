import { ThemeProvider } from "next-themes";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import BackButton from "@/components/BackButton";

const PrivacyPolicy = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <BackButton fallbackPath="/legal" />
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Shield className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: 8 March 2026</p>
            </div>

            <Card className="p-6 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Welcome to fulticket. We are a Zimbabwe-based digital platform committed to protecting your personal data. This privacy policy explains how we collect, use, store, and safeguard your information in compliance with the Data Protection Act of Zimbabwe (Chapter 11:12) and international best practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.1 Personal Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Full name, email address, phone number (Zimbabwean mobile format)</li>
                      <li>National ID or passport number (for cross-border travel bookings)</li>
                      <li>Payment information processed securely via Pesepay and O'mari (Old Mutual)</li>
                      <li>Travel preferences, booking history, and bill payment records</li>
                      <li>Wallet transaction history and peer-to-peer transfer records</li>
                      <li>Driver and vehicle information (for ride-hailing participants)</li>
                      <li>KYC documents submitted for merchant/agent verification</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.2 Usage Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Device information and IP address</li>
                      <li>Browser type and operating system</li>
                      <li>Pages visited and actions taken on our platform</li>
                      <li>Location data (with your consent, used for ride-hailing and nearby services)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Process bookings, bill payments, and wallet transactions</li>
                  <li>Send booking confirmations, ZESA tokens, and payment receipts via SMS and email</li>
                  <li>Match riders with drivers and provide real-time trip tracking</li>
                  <li>Provide customer support and resolve disputes</li>
                  <li>Verify merchant and agent identities (KYC compliance)</li>
                  <li>Prevent fraud, money laundering, and ensure platform security</li>
                  <li>Calculate loyalty points and manage rewards programmes</li>
                  <li>Improve our services and user experience through analytics</li>
                  <li>Send promotional offers (with your consent)</li>
                  <li>Comply with Zimbabwean legal and regulatory obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Sharing</h2>
                <p className="text-muted-foreground mb-3">We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Service providers</strong> — Bus operators, event organisers, accommodation hosts, drivers, and other merchants to fulfil your bookings</li>
                  <li><strong>Payment processors</strong> — Pesepay and Old Mutual (O'mari) for secure transaction processing</li>
                  <li><strong>Utility providers</strong> — ZESA, BCC, Econet, NetOne, Telecel for bill payment processing via eSolutions</li>
                  <li><strong>SMS/Email providers</strong> — For transactional notifications (Sendai, Resend)</li>
                  <li><strong>Legal authorities</strong> — When required by Zimbabwean law or court order</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  We never sell your personal information to third parties for marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including: encrypted data transmission (TLS), secure cloud infrastructure, row-level database security policies, role-based access controls, and regular security audits. Payment card details are never stored on our servers — all payment processing is handled by certified third-party providers (Pesepay, Old Mutual).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
                <p className="text-muted-foreground mb-3">Under the Data Protection Act of Zimbabwe and our commitment to user privacy, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Access</strong> — Request a copy of your personal data</li>
                  <li><strong>Correction</strong> — Request correction of inaccurate information</li>
                  <li><strong>Deletion</strong> — Request deletion of your account and personal data via "Delete Account" in your profile settings</li>
                  <li><strong>Data Portability</strong> — Request an export of your data</li>
                  <li><strong>Opt-out</strong> — Unsubscribe from marketing communications at any time</li>
                  <li><strong>Withdraw Consent</strong> — Withdraw consent for location tracking or promotional notifications</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  To exercise any of these rights, contact us at privacy@fulticket.com or use the self-service options in your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies and local storage to maintain your session, remember preferences, and improve your experience. We use essential cookies only — no third-party advertising cookies. You can manage cookie preferences in your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We retain your personal information as follows:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Account data:</strong> Until you request deletion</li>
                    <li><strong>Booking & transaction records:</strong> 7 years (ZIMRA tax compliance)</li>
                    <li><strong>KYC documents:</strong> Duration of merchant/agent relationship plus 5 years</li>
                    <li><strong>SMS/notification logs:</strong> 12 months for audit purposes</li>
                    <li><strong>Failed login attempts:</strong> Automatically purged after 1 hour</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our platform is not intended for children under 13. We do not knowingly collect personal information from children. Parents or guardians must make bookings on behalf of minors.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. International Transfers</h2>
                <p className="text-muted-foreground">
                  Your data is primarily processed and stored in secure cloud infrastructure. For cross-border bookings (e.g., Harare–Johannesburg), limited booking details are shared with operators in the destination country. We ensure appropriate safeguards are in place to protect your information in all cases.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy periodically. Material changes will be communicated via email and in-app notification at least 14 days before taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
                <p className="text-muted-foreground">For privacy-related questions or to exercise your rights, contact us at:</p>
                <div className="mt-3 space-y-1 text-muted-foreground">
                  <p><strong>Data Protection Officer:</strong> privacy@fulticket.com</p>
                  <p><strong>WhatsApp:</strong> +263 78 000 0000</p>
                  <p><strong>Address:</strong> Harare, Zimbabwe</p>
                </div>
              </section>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default PrivacyPolicy;
