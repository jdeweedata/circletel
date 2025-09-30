# Marketing Team Role Configuration

## Role: Marketing Manager

### Permissions

**Content Types:**
- ✅ Promotion (Full CRUD + Publish)
- ✅ Marketing Page (Full CRUD + Publish)
- ✅ Campaign (Full CRUD + Publish)

**Media Library:**
- ✅ Upload images
- ✅ Read/Update/Delete own uploads
- ✅ Create folders and organize media

**Settings:**
- ❌ No access to system settings
- ❌ No access to roles/permissions
- ❌ No access to API tokens

## Setup Instructions

### 1. Start Strapi Admin Panel
```bash
cd strapi-cms
npm run develop
```

### 2. Create First Admin (if not done)
- Navigate to http://localhost:1337/admin
- Create your super admin account

### 3. Create Marketing Manager Role
1. Go to Settings → Roles (under USERS & PERMISSIONS PLUGIN)
2. Click "Add new role"
3. Name: "Marketing Manager"
4. Description: "Manage promotions, marketing pages, and campaigns"

### 4. Set Permissions for Marketing Manager

**Promotion:**
- [x] find (Read all)
- [x] findOne (Read one)
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

**Marketing-page:**
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

**Campaign:**
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

**Upload (Media Library):**
- [x] upload
- [x] find
- [x] findOne
- [x] destroy (for own files)

### 5. Create Marketing Team Users
1. Go to Settings → Users (under USERS & PERMISSIONS PLUGIN)
2. Click "Add new user"
3. Fill in details (firstname, lastname, email)
4. Select Role: "Marketing Manager"
5. Set password
6. Active: Yes
7. Click Save

### 6. Share Access Details with Team
- URL: http://localhost:1337/admin (or your production URL)
- Email: [user email]
- Password: [provided password]
- Role: Marketing Manager

## Content Management Workflow

### Creating a Promotion
1. Go to Content Manager → Promotion → Create new entry
2. Fill in required fields (title, short description, category)
3. Upload featured image
4. Set pricing, CTA, colors
5. Set dates for promotion period
6. Save as draft or Publish immediately

### Creating a Marketing Page
1. Go to Content Manager → Marketing Page → Create new entry
2. Set title and slug (URL path)
3. Add Hero section with title and background
4. Add dynamic sections (Promo Grid, Features, CTA Banner, etc.)
5. Link relevant promotions
6. Save and Publish

### Creating a Campaign
1. Go to Content Manager → Campaign → Create new entry
2. Set campaign name, type, and dates
3. Link associated promotions and marketing pages
4. Set status (draft/scheduled/active)
5. Track performance with analytics field

## Best Practices

1. **Always use descriptive titles** - Makes content easier to find
2. **Set appropriate dates** - Ensures promotions show/hide automatically
3. **Use priority field** - Controls display order (higher = shown first)
4. **Test in draft mode** - Preview before publishing
5. **Optimize images** - Keep file sizes under 500KB for web performance
6. **Use consistent categories** - Makes filtering work properly