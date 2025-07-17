

Node.js Deployment (Express)

### Step 1: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Upload and setup your application
```bash
# Upload all files including package.json and server.js
# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 3: Start your application
```bash
# Start with PM2
pm2 start server.js --name "bb-windows-2"
pm2 startup
pm2 save
```

### Step 4: Configure Nginx as reverse proxy
```bash
sudo nano /etc/nginx/sites-available/bb-windows-2
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate (Optional but Recommended)

### Install Certbot for Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Firewall Configuration
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Monitoring and Maintenance

### For Node.js deployment:
```bash
# Check application status
pm2 status
pm2 logs bb-windows-2

# Restart application
pm2 restart bb-windows-2
```

### For Nginx:
```bash
# Check Nginx status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Quick Commands Summary

### Upload files via Git (if you have a repository):
```bash
git clone https://github.com/yourusername/bb-windows-2.git
cd bb-windows-2
```

### Test your deployment:
- Static: `http://your-server-ip` or `http://your-domain.com`
- Node.js: Same URL, but served through Express

## Troubleshooting

1. **Permission issues**: Make sure nginx user has access to files
2. **Port issues**: Ensure your application is running on the correct port
3. **Firewall**: Check if ports 80 and 443 are open
4. **Domain**: Update DNS records to point to your server IP

Choose Option 1 for simple deployment, or Option 2 if you need server-side functionality.

## Automated Deployment with deploy.sh

For automated deployments, use the included `deploy.sh` script:

### First-time Setup

1. **Upload your files to the server:**
```bash
# Create the directory
sudo mkdir -p /var/www/bb-windows-2
cd /var/www/bb-windows-2

# Initialize git and add your remote repository
sudo git init
sudo git remote add origin https://github.com/yourusername/bb-windows-2.git
sudo git pull origin main

# Make deploy script executable
sudo chmod +x deploy.sh
```

2. **Run the deployment script:**
```bash
sudo ./deploy.sh
```

### Automatic Deployments

The script automatically:
- ✅ Pulls latest changes from git
- ✅ Detects static vs Node.js deployment
- ✅ Configures Nginx properly
- ✅ Handles permissions and security
- ✅ Removes the default Nginx welcome page
- ✅ Tests configuration before applying
- ✅ Provides detailed logging

### Usage Examples

```bash
# Full deployment (pull changes + redeploy)
sudo ./deploy.sh

# Check application status only
sudo ./deploy.sh --status

# Show help
sudo ./deploy.sh --help
```

### Logs and Monitoring

- **Deployment logs:** `/var/log/bigbrains-deploy.log`
- **Nginx logs:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log` 