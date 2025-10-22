# Implementation Plan: AWS Amplify Gen 2 Static Hosting

## Overview

Configure AWS Amplify Gen 2 for static site hosting with Git-based continuous deployment. This setup enables automatic deployment of the TypeScript game whenever code is pushed to the connected Git repository.

## Types

No TypeScript type changes required. This implementation focuses on build configuration and deployment infrastructure without modifying the application code.

## Files

### New Files

**amplify.yml** (root directory)
- Purpose: Amplify build specification file
- Defines build phases (preBuild, build)
- Specifies artifact location (dist/)
- Configures build caching for node_modules and npm cache

**docs/AWS_DEPLOYMENT.md** (documentation directory)
- Purpose: Step-by-step AWS console setup guide
- Instructions for connecting Git repository
- Deployment workflow documentation
- Troubleshooting tips

### Modified Files

**.gitignore** (root directory)
- Add Amplify-specific exclusions:
  - `.amplify-hosting/` (Amplify build cache)
  - `amplify_outputs.json` (if backend is added later)
  - `.amplifyrc` (Amplify CLI configuration)

### Unchanged Files

**package.json** - Already has correct build script: `"build": "tsc && vite build"`
**vite.config.ts** - Already outputs to `dist/` directory
**tsconfig.json** - No changes needed

## Functions

No function changes required. This is a pure infrastructure/configuration implementation.

## Classes

No class changes required. All application code remains unchanged.

## Dependencies

### No New Dependencies Required

The existing dependencies are sufficient:
- `vite` (already installed) - Build tool
- `typescript` (already installed) - TypeScript compiler
- `@vitejs/plugin-basic-ssl` (already installed) - HTTPS support

### Optional Future Dependencies

If you later want to add Amplify backend features:
- `@aws-amplify/backend` - Backend resource definitions
- `aws-amplify` - Amplify JavaScript library
- `@aws-amplify/ui-react` - UI components (if using React)

## Testing

### Local Build Verification

1. **Test Production Build**
   ```bash
   npm run build
   ```
   - Verify `dist/` directory is created
   - Confirm all assets are present (HTML, CSS, JS, sourcemaps)
   - Check `dist/index.html` references correct asset paths

2. **Test Preview Server**
   ```bash
   npm run preview
   ```
   - Verify game loads correctly from built files
   - Test all game functionality (movement, pause, etc.)
   - Confirm no console errors

3. **Manual HTML Test**
   - Open `dist/index.html` directly in browser
   - Verify game loads (may have CORS issues with modules)

### Post-Deployment Testing

1. **Initial Deployment**
   - Verify Amplify build succeeds
   - Check build logs for errors
   - Access deployed URL
   - Test game functionality on deployed site

2. **Continuous Deployment Test**
   - Make a minor change (e.g., update README)
   - Commit and push to Git
   - Verify Amplify triggers new build automatically
   - Confirm changes appear on deployed site

3. **Cross-Browser Testing**
   - Test on Chrome, Firefox, Safari, Edge
   - Test on mobile devices (iOS Safari, Chrome Android)
   - Verify Canvas rendering and touch controls

4. **Performance Testing**
   - Check page load time
   - Verify CloudFront CDN is serving assets
   - Test from different geographic locations
   - Confirm HTTPS is working

## Implementation Order

### Phase 1: Local Configuration (5 minutes)

1. **Create amplify.yml**
   - Define build specification
   - Configure artifacts and caching
   - Validate YAML syntax

2. **Update .gitignore**
   - Add Amplify-specific exclusions
   - Commit changes

3. **Create documentation**
   - Write AWS_DEPLOYMENT.md with console setup steps
   - Include troubleshooting section

4. **Test local build**
   - Run `npm run build`
   - Verify dist/ output
   - Test with `npm run preview`

### Phase 2: AWS Console Setup (10-15 minutes)

5. **AWS Console Login**
   - Navigate to AWS Amplify service
   - Select appropriate region

6. **Create New App**
   - Click "New app" → "Host web app"
   - Connect Git provider (GitHub/GitLab/Bitbucket)
   - Authorize AWS access to repository

7. **Configure Build Settings**
   - Select repository
   - Select branch (e.g., main)
   - Amplify auto-detects amplify.yml
   - Review build settings
   - Configure environment variables (if needed)

8. **Deploy Application**
   - Start initial deployment
   - Monitor build logs
   - Wait for deployment to complete (3-5 minutes)

### Phase 3: Verification (10 minutes)

9. **Test Deployed Site**
   - Access Amplify-provided URL
   - Test game functionality
   - Verify HTTPS certificate
   - Check network tab for asset loading

10. **Configure Custom Domain (Optional)**
    - Add custom domain in Amplify console
    - Configure DNS records
    - Wait for SSL certificate provisioning

11. **Test Continuous Deployment**
    - Make a test commit
    - Push to repository
    - Verify automatic build triggers
    - Confirm changes deploy successfully

### Phase 4: Documentation & Cleanup (5 minutes)

12. **Update README.md**
    - Add deployment section
    - Link to AWS_DEPLOYMENT.md
    - Include deployed URL

13. **Create .amplifyrc (optional)**
    - Store Amplify app configuration
    - Add to .gitignore

## AWS Console Setup Commands

These commands are for reference during AWS Console configuration:

### Reading Implementation Plan Sections

```bash
# Read Overview section
sed -n '/## Overview/,/## Types/p' implementation_plan.md | head -n -1 | cat

# Read Types section
sed -n '/## Types/,/## Files/p' implementation_plan.md | head -n -1 | cat

# Read Files section
sed -n '/## Files/,/## Functions/p' implementation_plan.md | head -n -1 | cat

# Read Functions section
sed -n '/## Functions/,/## Classes/p' implementation_plan.md | head -n -1 | cat

# Read Classes section
sed -n '/## Classes/,/## Dependencies/p' implementation_plan.md | head -n -1 | cat

# Read Dependencies section
sed -n '/## Dependencies/,/## Testing/p' implementation_plan.md | head -n -1 | cat

# Read Testing section
sed -n '/## Testing/,/## Implementation Order/p' implementation_plan.md | head -n -1 | cat

# Read Implementation Order section
sed -n '/## Implementation Order/,$p' implementation_plan.md | cat
```

## Expected Outcomes

### Successful Implementation

✅ **Build Configuration**: amplify.yml properly configures build process
✅ **Git Integration**: Repository connected to Amplify
✅ **Automatic Builds**: Push to Git triggers deployment
✅ **Global CDN**: Game served via CloudFront
✅ **HTTPS**: Free SSL certificate active
✅ **Fast Builds**: Caching reduces build time to 1-2 minutes
✅ **Monitoring**: Build logs available in Amplify console

### Deployment URL Structure

```
https://[branch].[app-id].amplifyapp.com
```

Example:
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

### Build Process Flow

```
Git Push
    ↓
Amplify Webhook Trigger
    ↓
Install Dependencies (npm ci)
    ↓
Build Application (npm run build)
    ↓
Upload Artifacts (dist/)
    ↓
Deploy to CloudFront
    ↓
Live Site Updated
```

## Rollback Strategy

If deployment fails or issues arise:

1. **Revert Git Commit**
   ```bash
   git revert HEAD
   git push
   ```
   - Amplify will automatically deploy previous version

2. **Manual Rollback in Console**
   - Navigate to Amplify console
   - Select "Deployments" tab
   - Click "Redeploy" on previous successful build

3. **Disable Auto-Deploy**
   - In Amplify console, go to App settings
   - Turn off auto-deploy
   - Deploy manually when ready

## Future Enhancements

### Branch-Based Deployments

Configure multiple branches for different environments:
- `main` → Production (`https://main.[app-id].amplifyapp.com`)
- `dev` → Development (`https://dev.[app-id].amplifyapp.com`)
- `pr-*` → Preview deployments for pull requests

### Custom Domain Setup

Add custom domain (e.g., `game.yourdomain.com`):
1. Purchase domain (Route 53, Namecheap, etc.)
2. Add domain in Amplify console
3. Configure DNS records
4. Wait for SSL certificate provisioning (5-10 minutes)

### Environment Variables

Add environment-specific configuration:
- API endpoints (if backend added later)
- Feature flags
- Analytics IDs
- Third-party service keys

### Monitoring & Analytics

Enable additional AWS services:
- **CloudWatch**: Monitor traffic and errors
- **CloudFront Analytics**: Track CDN performance
- **AWS Cost Explorer**: Monitor hosting costs

### Backend Integration (Future)

If you later want to add backend features:
1. Install `@aws-amplify/backend`
2. Create `amplify/` directory structure
3. Define backend resources (auth, data, storage)
4. Update amplify.yml with backend build phase
5. Deploy backend and frontend together

## Cost Estimates

### AWS Free Tier (First 12 months)
- 1,000 build minutes/month
- 15 GB data transfer/month
- 5 GB storage

### Typical Usage (Small Game)
- Build time: ~2 minutes per deployment
- Build frequency: 10 deployments/month = 20 build minutes
- Data transfer: ~100 MB/month (for low traffic)
- **Estimated cost**: $0/month (within free tier)

### After Free Tier
- Build minutes: $0.01/minute
- Data transfer: $0.15/GB
- Storage: $0.023/GB-month
- **Estimated cost for small game**: $1-5/month

## Security Considerations

### Current Setup (Static Site)
- ✅ HTTPS by default (free SSL certificate)
- ✅ CloudFront CDN (DDoS protection)
- ✅ No exposed backend (static files only)
- ✅ No sensitive data stored

### Best Practices
- Never commit sensitive data (API keys, credentials)
- Use environment variables for configuration
- Enable CloudFront access logs (optional)
- Set up AWS Budget alerts

## Troubleshooting

### Build Failures

**Issue**: Build fails with "npm ci" error
- **Solution**: Ensure package-lock.json is committed to Git

**Issue**: Build fails with TypeScript errors
- **Solution**: Run `npm run build` locally first to fix errors

**Issue**: Build succeeds but site shows blank page
- **Solution**: Check browser console for errors, verify vite.config.ts paths

### Deployment Issues

**Issue**: Changes not appearing on deployed site
- **Solution**: Check Amplify build triggered, clear browser cache

**Issue**: 404 errors on deployed site
- **Solution**: Verify amplify.yml artifacts baseDirectory is correct

**Issue**: CSS/JS not loading
- **Solution**: Check index.html asset paths are relative, not absolute

## References

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amplify Hosting](https://docs.amplify.aws/gen1/javascript/deploy-and-host/)
- [Vite Build Configuration](https://vitejs.dev/guide/build.html)
- [Amplify Build Specification](https://docs.amplify.aws/gen1/javascript/deploy-and-host/deployment/build-specification/)
