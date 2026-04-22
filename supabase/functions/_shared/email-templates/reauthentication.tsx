/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>🎫 fulticket</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm reauthentication</Heading>
          <Text style={text}>Use the code below to confirm your identity:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            This code will expire shortly. If you didn't request this, you can safely ignore this email.
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

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#5271ff', padding: '28px 32px', textAlign: 'center' as const, borderRadius: '16px 16px 0 0' }
const logo = { fontSize: '24px', fontWeight: '800' as const, color: '#ffffff', letterSpacing: '-0.5px', margin: '0' }
const content = { padding: '32px 32px 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: '#5271ff', textDecoration: 'none' }
const codeStyle = { fontFamily: "'SF Mono', 'Fira Code', Consolas, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#5271ff', margin: '0 0 30px', textAlign: 'center' as const, letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerSection = { backgroundColor: '#fafbfc', padding: '20px 32px', textAlign: 'center' as const, borderTop: '1px solid #eee', borderRadius: '0 0 16px 16px' }
const footerBrand = { fontSize: '13px', color: '#888', margin: '0 0 8px' }
const copyright = { fontSize: '11px', color: '#bbb', margin: '0' }
