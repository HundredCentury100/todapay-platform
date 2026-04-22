import { ThemeProvider } from "next-themes";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import BackButton from "@/components/BackButton";

const TermsAndConditions = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <BackButton fallbackPath="/legal" />
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <FileText className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Terms & Conditions</h1>
              <p className="text-muted-foreground">Last updated: 8 March 2026</p>
            </div>

            <Card className="p-6 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using fulticket ("the Platform"), you agree to be bound by these Terms and Conditions, governed by the laws of Zimbabwe. If you disagree with any part of these terms, you may not use our Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Platform Description</h2>
                <p className="text-muted-foreground">
                  fulticket is a multi-service digital platform operating in Zimbabwe that connects customers with transport operators (bus, ride-hailing, car rental, transfers), event organisers, accommodation providers, workspace operators, venue owners, and experience hosts. We facilitate bookings, bill payments, and digital wallet services but do not own or operate the underlying services. We also provide bill payment services for utilities (ZESA), council services (BCC), airtime, and retail accounts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>3.1 You must provide accurate and complete information when creating an account.</p>
                  <p>3.2 You are responsible for maintaining the confidentiality of your account credentials.</p>
                  <p>3.3 You must be at least 18 years old to create an account.</p>
                  <p>3.4 You may not transfer your account to another person.</p>
                  <p>3.5 We reserve the right to suspend or terminate accounts that violate these terms.</p>
                  <p>3.6 You may request deletion of your account and personal data at any time through the "Delete Account" option in your profile settings. Account deletion is permanent and cannot be reversed.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Booking Terms</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>4.1 Booking Confirmation:</strong> A booking is confirmed only when you receive a confirmation with a booking reference number via SMS, email, or in-app notification.</p>
                  <p><strong>4.2 Payment:</strong> Payments are processed via Suvat Pay (powered by Pesepay), O'mari (Old Mutual), or cash at the point of service. Full payment is required at the time of booking unless "Reserve & Pay Cash" is selected.</p>
                  <p><strong>4.3 Cash Reservations:</strong> Cash-reserved bookings have a payment deadline. Failure to pay before the deadline may result in automatic cancellation.</p>
                  <p><strong>4.4 Ticket Validity:</strong> Tickets are valid only for the specified date, time, and route/event.</p>
                  <p><strong>4.5 Name Changes:</strong> Passenger name changes may be subject to fees or restrictions.</p>
                  <p><strong>4.6 No-Show Policy:</strong> Failure to show up for your booking may result in ticket forfeiture.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Bill Payment Terms</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>5.1</strong> Bill payments processed through fulticket (ZESA tokens, BCC rates, airtime, retail accounts) are subject to a service fee of USD $1.00 per transaction for non-airtime, non-ZESA billers.</p>
                  <p><strong>5.2</strong> Once a bill payment is submitted and confirmed, it cannot be reversed. Tokens and airtime are delivered immediately upon successful payment.</p>
                  <p><strong>5.3</strong> fulticket is not responsible for incorrect account numbers or meter numbers provided by the user.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Digital Wallet Terms</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>6.1</strong> The fulticket Wallet is a stored-value digital wallet denominated in USD.</p>
                  <p><strong>6.2</strong> Wallet funds can be used for bookings, bill payments, and peer-to-peer transfers within the platform.</p>
                  <p><strong>6.3</strong> Wallet balances are non-interest-bearing and are not insured deposits.</p>
                  <p><strong>6.4</strong> fulticket reserves the right to freeze wallets suspected of fraudulent activity.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Cancellation & Refund Policy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>7.1 Cancellation Windows:</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>More than 24 hours before departure/event: 100% refund (minus processing fees)</li>
                    <li>12-24 hours before: 50% refund</li>
                    <li>Less than 6 hours: No refund</li>
                  </ul>
                  <p><strong>7.2 Operator Cancellations:</strong> If a service provider cancels, you will receive a full refund within 7-14 business days.</p>
                  <p><strong>7.3 Refund Processing:</strong> Refunds are processed to the original payment method or fulticket Wallet within 14 business days.</p>
                  <p><strong>7.4 Special Circumstances:</strong> Refunds for medical emergencies or bereavement may be considered on a case-by-case basis with documentation.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Ride-Hailing & Transfer Terms</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>8.1 Ride fares are estimated at booking and may vary based on actual distance, traffic, and surge pricing.</p>
                  <p>8.2 A platform commission of 10% applies to all ride and transfer fares.</p>
                  <p>8.3 Drivers are independent contractors and not employees of fulticket.</p>
                  <p>8.4 Cancellation fees may apply for rides cancelled after driver assignment.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Platform Fees</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>9.1 A service fee of $1 per $50 subtotal applies to most booking transactions.</p>
                  <p>9.2 A 10% platform fee is charged to merchants on each completed transaction (excluding bill payments).</p>
                  <p>9.3 Fee structures may be updated with 30 days notice to affected parties.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Travel Requirements</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>10.1 Documentation:</strong> You must carry valid identification (Zimbabwean national ID or passport) for all journeys.</p>
                  <p><strong>10.2 Cross-Border Travel:</strong> For routes to South Africa, Zambia, Mozambique, and Botswana, ensure you have valid travel documents, visas, and permits.</p>
                  <p><strong>10.3 Health Requirements:</strong> Comply with all health and vaccination requirements for your destination.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Limitation of Liability</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>11.1 fulticket acts as an intermediary platform and is not responsible for the actions of service providers.</p>
                  <p>11.2 We are not liable for delays, cancellations, or changes made by service providers.</p>
                  <p>11.3 Our maximum liability is limited to the value of your booking or transaction.</p>
                  <p>11.4 We are not responsible for indirect or consequential losses.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. User Conduct</h2>
                <p className="text-muted-foreground mb-3">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Use the platform for fraudulent purposes</li>
                  <li>Attempt to hack or disrupt the platform</li>
                  <li>Post offensive or inappropriate content in reviews</li>
                  <li>Violate any applicable Zimbabwean laws or regulations</li>
                  <li>Impersonate other users or entities</li>
                  <li>Use the wallet for money laundering or illicit financial activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">13. Dispute Resolution</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>13.1 Disputes should first be raised with our customer support team.</p>
                  <p>13.2 If unresolved, disputes will be governed by the laws of Zimbabwe and referred to arbitration in Harare.</p>
                  <p>13.3 The Consumer Protection Act of Zimbabwe applies to all consumer transactions on this platform.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">14. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Material changes will be communicated via email and in-app notification at least 14 days before taking effect. Continued use of the platform after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">15. Contact Information</h2>
                <p className="text-muted-foreground">For questions about these terms, contact us at:</p>
                <div className="mt-3 space-y-1 text-muted-foreground">
                  <p><strong>Email:</strong> legal@fulticket.com</p>
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

export default TermsAndConditions;
