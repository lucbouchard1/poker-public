## Deploy Instructions

### Deploy To Firebase

```
npm run build
firebase deploy
```

### Deploy Server

**IMPORTANT!** Make sure the service account key exists in `server/key/admin-auth-key.json`. If the key isn't there, the app engine app will not be able to access firebase.

```
cd server
npm run build
gcloud app deploy
```
