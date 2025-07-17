# Setting Up Firebase Service Account

To use the `staff-fix.js` script, you need Firebase Admin privileges via a service account key. Follow these steps to set up your service account:

## 1. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **operty-b54dc**

## 2. Create a Service Account

1. In the left sidebar, click on the gear icon (⚙️) and select **Project settings**
2. Navigate to the **Service accounts** tab
3. Click on **Generate new private key** button
4. Confirm by clicking **Generate key**
5. A JSON file will download - this is your service account key

## 3. Place the Service Account Key File

1. Create a directory in your home folder:

   ```
   mkdir -p ~/.google
   ```

2. Move the downloaded JSON file to this location with the name `service-account.json`:

   ```
   mv /path/to/downloaded-file.json ~/.google/service-account.json
   ```

3. Ensure the file has the correct permissions:
   ```
   chmod 600 ~/.google/service-account.json
   ```

## 4. Run the Fix Script

Once the service account is in place, you can run the staff fix script:

```
node staff-fix.js
```

## Troubleshooting

If you encounter permission errors:

- Verify the service account has proper access (should have Firebase Admin SDK Admin role)
- Ensure the service account file is correctly placed at `~/.google/service-account.json`
- Check the Firebase project ID matches with our project (operty-b54dc)
