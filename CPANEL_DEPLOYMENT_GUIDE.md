# TodaPay cPanel Deployment Guide

## What You Need

1. **Deployment Package**: `todapay-cpanel-deployment.zip` (already created in this directory)
2. **cPanel Access**: Your hosting account credentials
3. **Domain**: Your domain name (e.g., todapayments.com or app.todapayments.com)

## Step-by-Step Deployment Instructions

### Step 1: Access cPanel File Manager

1. Log in to your cPanel account
2. Find and click on **File Manager** under the "Files" section
3. Navigate to the directory where you want to deploy:
   - For main domain: `public_html/`
   - For subdomain (e.g., app.todapayments.com): `public_html/app/`
   - For addon domain: `public_html/yourdomain.com/`

### Step 2: Clean the Target Directory (if needed)

1. If deploying to an existing directory, **backup any existing files first**
2. Delete old files (but keep `.htaccess` if you have custom rules)

### Step 3: Upload the Deployment Package

1. Click the **Upload** button in File Manager
2. Select `todapay-cpanel-deployment.zip` from your computer
3. Wait for the upload to complete (progress bar will show 100%)
4. Go back to File Manager

### Step 4: Extract the ZIP File

1. Right-click on `todapay-cpanel-deployment.zip`
2. Click **Extract**
3. Choose the extraction path (usually current directory)
4. Click **Extract File(s)**
5. Wait for extraction to complete
6. Delete the ZIP file after extraction

### Step 5: Verify File Structure

After extraction, you should see these files in your target directory:

```
index.html          (main entry point)
registerSW.js       (service worker registration)
sw.js               (Progressive Web App service worker)
workbox-*.js        (PWA caching library)
manifest.webmanifest (PWA manifest)
assets/             (all CSS, JS, images)
  - index-*.css
  - index-*.js
  - *.png, *.jpg
  - other vendor files
```

### Step 6: Create .htaccess for React Router

**IMPORTANT**: Since TodaPay is a Single Page Application (SPA) with client-side routing, you need to configure the server to redirect all requests to `index.html`.

Create a file named `.htaccess` in the same directory as `index.html` with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html to allow html5 state links
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

To create this file in cPanel:
1. In File Manager, click **+ File** button
2. Name it `.htaccess` (with the dot at the beginning)
3. Right-click the file and select **Edit**
4. Paste the content above
5. Save the file

### Step 7: Configure SSL (HTTPS)

**IMPORTANT**: Your Supabase backend requires HTTPS connections.

1. In cPanel, go to **SSL/TLS Status** or **Let's Encrypt SSL**
2. Enable SSL for your domain
3. Most cPanel hosts offer free SSL certificates via Let's Encrypt
4. Wait 5-10 minutes for SSL to activate
5. Test by visiting `https://yourdomain.com`

### Step 8: Test Your Deployment

Visit your domain in a browser:
- `https://yourdomain.com` or
- `https://app.todapayments.com`

You should see the TodaPay home page with:
- ✅ Search functionality working
- ✅ Login/signup working (connects to Supabase)
- ✅ Routing working (no 404 errors when clicking links)
- ✅ Mobile responsive design
- ✅ PWA install prompt (on mobile browsers)

### Common Issues & Solutions

#### Issue 1: "404 Not Found" when accessing routes
**Solution**: Check that `.htaccess` file is created correctly with mod_rewrite rules.

#### Issue 2: Supabase connection errors
**Solution**: Verify your `.env` file has correct Supabase credentials and that your site is using HTTPS.

#### Issue 3: Assets not loading (blank page)
**Solution**: Check browser console for errors. Ensure all files in `assets/` folder were extracted properly.

#### Issue 4: CSS not applying
**Solution**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache.

#### Issue 5: PWA not installing
**Solution**: Ensure you're using HTTPS. PWAs require SSL certificates.

## Environment Variables

Your app is already configured with Supabase credentials in the build. These are embedded in the JavaScript files during the build process:

- Supabase URL: `https://celkdpsuqeqmzevlzkqj.supabase.co`
- Supabase Key: (embedded in build)

**Note**: If you need to change environment variables later, you must:
1. Update `.env` file locally
2. Run `npm run build` again
3. Re-upload and extract the new `dist/` files

## Performance Optimization (Optional)

### Enable Cloudflare (if available)
1. Sign up for Cloudflare (free plan available)
2. Point your domain's nameservers to Cloudflare
3. Enable Auto Minify (HTML, CSS, JS)
4. Enable Brotli compression
5. Set caching rules for static assets

### Enable Gzip in cPanel
Already included in the `.htaccess` file above.

## Subdomain Setup (Optional)

If you want to deploy to a subdomain like `app.todapayments.com`:

1. In cPanel, go to **Domains** or **Subdomains**
2. Create subdomain: `app`
3. Set document root to: `public_html/app`
4. Upload and extract files to this directory
5. Create `.htaccess` as described above
6. Enable SSL for the subdomain

## File Structure After Deployment

```
public_html/
├── index.html
├── .htaccess (you create this)
├── registerSW.js
├── sw.js
├── workbox-4b126c97.js
├── manifest.webmanifest
└── assets/
    ├── index-Bswscj4-.css
    ├── index-CZbelwl6.js
    ├── animation-vendor-DKXzJlKP.js
    ├── chart-vendor-RHThODhk.js
    ├── date-vendor-DCxIAkaG.js
    ├── form-vendor-YKck_o_j.js
    ├── pdf-vendor-T5vpNVUR.js
    ├── radix-vendor-D-wRD8HF.js
    ├── react-vendor-CbDeC4Er.js
    ├── supabase-vendor-CTD_wAJX.js
    ├── ui-vendor-BvU6FB8X.js
    ├── RideMap-BDsTlQ6W.js
    ├── LocationPicker-BQXJ2gcc.js
    ├── purify.es-B5CD4DQe.js
    ├── index.es-C73jtsep.js
    └── [all PNG/JPG images]
```

## Deployment Checklist

- [ ] Uploaded `todapay-cpanel-deployment.zip` to cPanel
- [ ] Extracted ZIP to target directory
- [ ] Created `.htaccess` file with React Router rules
- [ ] Enabled SSL/HTTPS for domain
- [ ] Tested website in browser (desktop & mobile)
- [ ] Verified Supabase connection (login/signup works)
- [ ] Verified routing (no 404 errors)
- [ ] Tested PWA installation on mobile
- [ ] Checked browser console for errors

## Support

If you encounter issues:
1. Check browser console (F12 → Console tab) for JavaScript errors
2. Check cPanel Error Log (in Metrics section)
3. Verify `.htaccess` syntax using online validators
4. Ensure PHP version is 7.4+ (in cPanel → Select PHP Version)

## Updating the App

When you make changes to the app:

1. Run `npm run build` locally
2. Create new ZIP: `powershell -Command "Compress-Archive -Path dist\* -DestinationPath todapay-update.zip -Force"`
3. Upload and extract in cPanel (overwrite existing files)
4. Clear browser cache on user devices

---

**Deployment Package**: `todapay-cpanel-deployment.zip`
**Created**: 2026-04-27
**Platform**: TodaPay (formerly Fulticket)
**Backend**: Supabase Cloud
**Framework**: React 18.3.1 + Vite 5.4.19
