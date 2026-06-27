# Google Cloud Run Deployment

This project is prepared for deployment on Google Cloud Run.

## Required Links For Submission

- GitHub Repository: `https://github.com/AustinKarasu/CivicPulse`
- Deployed Application Link: paste the Cloud Run service URL after deployment.

## Prerequisites

- Google Cloud project with billing enabled
- Google Cloud SDK installed
- Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs enabled
- `GEMINI_API_KEY` available as a Cloud Run environment variable or Secret Manager secret

## Recommended Deployment Command

Run this from the repository root after logging in with `gcloud auth login`:

```bash
gcloud run deploy civicpulse-ai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production,VITE_APP_MODE=demo
```

For full AI functionality, add a Gemini key:

```bash
gcloud run deploy civicpulse-ai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production,VITE_APP_MODE=demo,GEMINI_API_KEY=YOUR_KEY
```

For production Firebase mode, use:

```bash
gcloud run deploy civicpulse-ai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production,VITE_APP_MODE=firebase,GEMINI_API_KEY=YOUR_KEY,FIREBASE_API_KEY=YOUR_KEY,FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN,FIREBASE_PROJECT_ID=YOUR_PROJECT,FIREBASE_STORAGE_BUCKET=YOUR_BUCKET,FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER,FIREBASE_APP_ID=YOUR_APP_ID
```

## Notes

- The Dockerfile builds the Vite frontend and bundles the Express server into `dist/server.cjs`.
- The server listens on `process.env.PORT`, defaulting to `3000`.
- `.env` is ignored and is not copied into the Docker image.
- Use Secret Manager for real production secrets instead of plain CLI environment variables.
