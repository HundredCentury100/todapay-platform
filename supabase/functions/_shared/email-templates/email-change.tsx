/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>🎫 fulticket</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm your email change</Heading>
          <Text style={text}>
            You requested to change your email address for {siteName} from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>Click the button below to confirm this change:</Text>
          <Button style={button} href={confirmationUrl}>
            Confirm Email Change
          </Button>
          <Text style={footer}>
            If you didn't request this change, please secure your account immediately.
          </Text>
        </Section>
        <Section style={footerSection}>
          <Text style={footerBrand}>Need help? <Link href="mailto:support@fulticket.com" style={link}>support@fulticket.com</Link></Text>
          <Text style={copyright}>© 2026 Suvat Group · fulticket</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#5271ff', padding: '28px 32px', textAlign: 'center' as const, borderRadius: '16px 16px 0 0' }
const logo = { fontSize: '24px', fontWeight: '800' as const, color: '#ffffff', letterSpacing: '-0.5px', margin: '0' }
const content = { padding: '32px 32px 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: '#5271ff', textDecoration: 'underline' }
const button = { backgroundColor: '#5271ff', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '13px 36px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerSection = { backgroundColor: '#fafbfc', padding: '20px 32px', textAlign: 'center' as const, borderTop: '1px solid #eee', borderRadius: '0 0 16px 16px' }
const footerBrand = { fontSize: '13px', color: '#888', margin: '0 0 8px' }
const copyright = { fontSize: '11px', color: '#bbb', margin: '0' }
