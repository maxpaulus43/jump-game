# AWS Amplify Deployment Guide

This guide walks you through deploying your TypeScript game to AWS Amplify with Git-based continuous deployment.

## Prerequisites

- [ ] AWS Account (create one at [aws.amazon.com](https://aws.amazon.com))
- [ ] Git repository hosted on GitHub, GitLab, or Bitbucket
- [ ] Code committed and pushed to your repository
- [ ] `amplify.yml` file in your repository root (already created)

## Deployment Steps

### Step 1: Access AWS Amplify Console

1. Log into your AWS account at [console.aws.amazon.com](https://console.aws.amazon.com)
2. Navigate to **AWS Amplify** service
   - Use the search bar at the top and type "Amplify"
   - Or find it under "Frontend Web & Mobile" category
3. Select your preferred region (e.g., us-east-1, us-west-2)

### Step 2: Create New Amplify App

1. Click the **"New app"** button (orange/yellow button in top right)
2. Select **"Host web app"** from the dropdown
3. Choose your Git provider:
   - **GitHub** (recommended for most users)
   - **GitLab**
   - **Bitbucket**
   - **AWS CodeCommit**
4. Click **"Continue"**

### Step 3: Authorize Git Provider Access

**For GitHub:**
1. Click "Authorize AWS Amplify" button
2. Sign in to GitHub if prompted
3. Grant AWS Amplify access to your repositories
4. You may need to install the AWS Amplify app on your GitHub account

**For GitLab/Bitbucket:**
1. Follow similar authorization flow
2. Provide access token if required

### Step 4: Select Repository and Branch

1. **Select Repository**: Choose your game repository from the dropdown
2. **Select Branch**: Choose the branch to deploy (typically `main` or `master`)
3. Check the box for **"Connecting a monorepo? Pick a folder."** if your game is in a subfolder (skip if it's in the root)
4. Click **"Next"**

### Step 5: Configure Build Settings

Amplify will automatically detect the `amplify.yml` file and display:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .npm/**/*
```

1. **Review the build settings** - These should match the content above
2. **App name**: Keep the default or customize (e.g., "my-game")
3. **Environment name**: Keep default "main" or customize (e.g., "production")
4. **Advanced settings** (optional):
   - Add environment variables if needed (none required for static hosting)
   - Modify build timeout if builds take longer (default is 30 minutes)
5. Click **"Next"**

### Step 6: Review and Deploy

1. **Review all settings** on the final page
2. Click **"Save and deploy"** button
3. Amplify will start the deployment process:
   - **Provision**: Sets up resources (~30 seconds)
   - **Build**: Runs `npm ci` and `npm run build` (~2-3 minutes)
   - **Deploy**: Deploys to CloudFront CDN (~30 seconds)
   - **Verify**: Final checks (~10 seconds)

### Step 7: Monitor Build Progress

Watch the build logs in real-time:
1. Each phase will show a progress indicator
2. Click on any phase to see detailed logs
3. Green checkmarks indicate successful completion
4. Red X marks indicate failures (see troubleshooting section)

### Step 8: Access Your Deployed Game

Once deployment completes (typically 3-5 minutes):

1. Your game will be live at the provided URL:
   ```
   https://main.d1234567890abcdef.amplifyapp.com
   ```
2. Click the URL to test your deployed game
3. Verify all functionality works correctly

## Continuous Deployment Setup

Continuous deployment is now active! Here's how it works:

### Automatic Deployments

Every time you push code to your connected branch:
1. AWS Amplify detects the commit via webhook
2. Triggers an automatic build
3. Deploys the new version to your site
4. Updates the live URL with new content

### Testing Continuous Deployment

Make a test change:
```bash
# Make a small change to your game
echo "# Test deployment" >> README.md

# Commit and push
git add .
git commit -m "Test: Verify Amplify auto-deployment"
git push
```

Then watch the Amplify console:
- A new build will appear automatically
- Monitor the build progress
- Once complete, refresh your deployed site
- Changes should be live

## Custom Domain Setup (Optional)

### Adding a Custom Domain

1. In the Amplify console, click **"Domain management"** in the left sidebar
2. Click **"Add domain"**
3. Enter your domain name (e.g., `mygame.com`)
4. Amplify will provide DNS records to add:
   - **Type**: CNAME
   - **Name**: www (or your subdomain)
   - **Value**: Your Amplify domain
5. Add these records in your domain registrar's DNS settings
6. Wait for DNS propagation (can take 5-60 minutes)
7. Amplify will automatically provision an SSL certificate

### SSL Certificate

- Free SSL certificate included
- Auto-renews before expiration
- Covers all subdomains you add

## Branch Deployments (Optional)

Deploy multiple branches to different URLs:

### Setting Up Additional Branches

1. In Amplify console, go to **"App settings"** → **"Branch management"**
2. Click **"Connect branch"**
3. Select branch (e.g., `dev`, `staging`)
4. Configure build settings (usually same as main branch)
5. Save and deploy

### Branch URL Structure

Each branch gets its own URL:
- `main` branch: `https://main.[app-id].amplifyapp.com`
- `dev` branch: `https://dev.[app-id].amplifyapp.com`
- `staging` branch: `https://staging.[app-id].amplifyapp.com`

### Pull Request Previews

Enable automatic deployments for pull requests:
1. Go to **"App settings"** → **"General"**
2. Under **"Branches"**, enable **"Pull request previews"**
3. Each PR will get a unique preview URL
4. Test changes before merging to main

## Monitoring and Analytics

### Build History

View all deployments:
1. Click on your app in the Amplify console
2. **"Deployments"** tab shows all builds
3. Click any build to see:
   - Build duration
   - Build logs
   - Git commit details
   - Deployed URL

### Access Logs

Enable CloudFront access logs:
1. Go to **"App settings"** → **"Monitoring"**
2. Enable access logs
3. Choose S3 bucket for log storage
4. Analyze traffic patterns and errors

### Metrics

View performance metrics:
- Request count
- Data transfer
- Error rates
- Response times

## Environment Variables (Optional)

Add environment variables for configuration:

1. Go to **"App settings"** → **"Environment variables"**
2. Click **"Add variable"**
3. Enter key-value pairs:
   ```
   NODE_ENV=production
   API_ENDPOINT=https://api.example.com
   ```
4. Variables are available during build time
5. Access in code via `process.env.VARIABLE_NAME`

**Note**: For this static game, environment variables are not currently needed.

## Cost Management

### AWS Free Tier

New AWS accounts get 12 months of free tier:
- 1,000 build minutes per month
- 15 GB data transfer per month
- 5 GB storage

### Cost Estimates

**Typical usage for small game:**
- Build time: ~2 minutes per deployment
- 10 deployments/month = 20 build minutes
- Data transfer: ~100 MB/month
- **Estimated cost**: $0/month (within free tier)

**After free tier:**
- Build minutes: $0.01 per minute
- Data transfer: $0.15 per GB
- Storage: $0.023 per GB-month
- **Estimated cost**: $1-5/month for low traffic

### Setting Budget Alerts

Avoid unexpected charges:
1. Go to **AWS Billing Console**
2. Create a budget alert
3. Set threshold (e.g., $5/month)
4. Receive email notifications when approaching limit

## Troubleshooting

### Build Failures

#### Error: "npm ci" fails
**Cause**: Missing or corrupted package-lock.json
**Solution**:
```bash
# Delete and regenerate package-lock.json
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Fix: Regenerate package-lock.json"
git push
```

#### Error: TypeScript compilation fails
**Cause**: Type errors in code
**Solution**:
```bash
# Test locally first
npm run build

# Fix any TypeScript errors shown
# Then commit and push
```

#### Error: Build succeeds but site shows blank page
**Cause**: JavaScript errors or incorrect paths
**Solution**:
1. Open deployed site and check browser console (F12)
2. Look for JavaScript errors
3. Verify `vite.config.ts` has correct `base` path
4. Check `index.html` uses relative paths

### Deployment Issues

#### Changes not appearing on deployed site
**Solutions**:
1. Check if build was triggered in Amplify console
2. Wait for build to complete (check "Deployments" tab)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private browsing mode

#### 404 errors on deployed site
**Solutions**:
1. Verify `amplify.yml` has correct `baseDirectory: dist`
2. Check that `npm run build` creates `dist/` folder locally
3. Ensure `dist/index.html` exists after build

#### CSS/JS files not loading
**Solutions**:
1. Check browser network tab (F12) for failed requests
2. Verify asset paths in `index.html` are relative (e.g., `/css/style.css` or `./css/style.css`)
3. Check `vite.config.ts` build configuration

### Connection Issues

#### Cannot connect Git repository
**Solutions**:
1. Verify GitHub/GitLab/Bitbucket access
2. Re-authorize AWS Amplify app
3. Check repository permissions
4. Try disconnecting and reconnecting

#### Webhook not triggering builds
**Solutions**:
1. Go to repository settings → Webhooks
2. Verify AWS Amplify webhook exists
3. Check webhook delivery history
4. Re-connect branch in Amplify console

### Performance Issues

#### Slow build times
**Solutions**:
1. Verify caching is working (check build logs)
2. Consider reducing dependencies
3. Check for large files in repository
4. Review `npm ci` vs `npm install` usage

#### Slow page loads
**Solutions**:
1. Enable gzip compression (default in Amplify)
2. Optimize image sizes
3. Minimize JavaScript bundle size
4. Use CloudFront caching effectively

## Rollback Procedures

### Rollback to Previous Version

If a deployment introduces issues:

**Option 1: Redeploy Previous Build**
1. Go to **"Deployments"** tab
2. Find the last working build
3. Click the **"Redeploy this version"** button
4. Wait for redeployment (~1 minute)

**Option 2: Revert Git Commit**
```bash
# Revert the problematic commit
git revert HEAD

# Push to trigger automatic deployment
git push
```

**Option 3: Disable Auto-Deploy**
1. Go to **"App settings"** → **"Build settings"**
2. Disable auto-build for your branch
3. Deploy manually when ready

### Emergency Shutdown

To temporarily take down the site:
1. Go to **"App settings"** → **"General"**
2. Delete the branch connection
3. Site will return 404 errors
4. Reconnect branch when ready to restore

## Security Best Practices

### Code Security

- ✅ Never commit sensitive data (API keys, passwords)
- ✅ Use environment variables for configuration
- ✅ Review code before pushing to main branch
- ✅ Enable branch protection on GitHub

### AWS Security

- ✅ Enable MFA (Multi-Factor Authentication) on AWS account
- ✅ Use IAM roles with minimal permissions
- ✅ Regularly review CloudTrail logs
- ✅ Set up AWS Budget alerts

### Content Security

- ✅ HTTPS enabled by default (free SSL)
- ✅ CloudFront CDN provides DDoS protection
- ✅ Regular security updates via npm
- ✅ No backend means minimal attack surface

## Maintenance

### Regular Tasks

**Weekly:**
- Check build success rate
- Review error logs if any
- Monitor data transfer usage

**Monthly:**
- Update npm dependencies
- Review AWS costs
- Check SSL certificate status (auto-renews)

**Quarterly:**
- Review and update documentation
- Test disaster recovery procedures
- Audit AWS permissions

### Dependency Updates

Keep dependencies current:
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Test locally
npm run build
npm run preview

# Commit and deploy
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

## Getting Help

### AWS Support

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Support Center](https://console.aws.amazon.com/support/)
- [AWS Forums](https://forums.aws.amazon.com/forum.jspa?forumID=314)

### Community Resources

- [AWS Amplify Discord](https://discord.gg/amplify)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/aws-amplify)
- [GitHub Issues](https://github.com/aws-amplify/amplify-hosting/issues)

### Professional Support

AWS offers paid support plans:
- **Developer**: $29/month
- **Business**: $100/month
- **Enterprise**: Custom pricing

For a simple static site, the free community support is usually sufficient.

## Next Steps

After successful deployment:

1. ✅ Test all game functionality on deployed site
2. ✅ Share the URL with others for testing
3. ✅ Set up custom domain (optional)
4. ✅ Configure branch deployments (optional)
5. ✅ Add monitoring and alerts
6. ✅ Update project README with live URL

## Additional Resources

- **Amplify Console**: [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- **CloudFront Dashboard**: Monitor CDN performance
- **Cost Explorer**: Track AWS spending
- **CloudWatch Logs**: View detailed application logs

---

**Last Updated**: January 2025
**Amplify Version**: Gen 2
**Node Version**: 16+
