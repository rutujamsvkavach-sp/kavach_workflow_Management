# kavach_workflow Management - Indian Railway Workflow Management System

Production-ready full-stack workflow management platform for Indian Railway departments, built with React, Tailwind CSS, Node.js, Express, JWT authentication, MongoDB Atlas data storage, and secure file uploads.

## Features

- JWT authentication with bcrypt password hashing
- Role-based access for `admin` and `staff`
- MongoDB Atlas-powered CRUD operations
- Department workflow modules
- Secure PDF, Excel, and image uploads using multer
- Responsive government dashboard UI
- Admin user approval and role management
- Toast notifications, loading states, confirmation modal, and search filters
- Deployment-ready frontend config for Vercel and backend config for Render
- Optional Cloudinary file storage for production deployments

## Project Structure

```text
Task Management WebSite/
  backend/
    controllers/
    middleware/
    routes/
    services/
    uploads/
    server.js
  frontend/
    src/
      components/
      context/
      pages/
      services/
      App.jsx
```

## MongoDB Atlas Setup

Create a MongoDB Atlas cluster, then:

1. Create a database user with read/write access.
2. Add network access for your deployment environment, or use `0.0.0.0/0` for broad access.
3. Copy your connection string and set it as `MONGODB_URI`.

## Backend Setup

1. Go to [backend/.env.example](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/backend/.env.example) and copy it to `.env`.
2. Set `MONGODB_URI` and update `ADMIN_REGISTRATION_SECRET` if needed.
4. Run:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

1. Go to [frontend/.env.example](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/frontend/.env.example) and copy it to `.env`.
2. Run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Notes

- Uploaded files are stored locally in [backend/uploads](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/backend/uploads) for local development.
- For public deployment, use Cloudinary by setting `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in backend env variables.
- File URLs are stored in MongoDB in the `fileUrl` array field.
- Admin registration secret is currently set to `KavachAdmin@2026` in [backend/.env](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/backend/.env).

## Deploy For Staff Access

### Frontend on Vercel

1. Push the repository to GitHub.
2. Import the `frontend` folder into Vercel as a project.
3. In Vercel environment variables, set:

```text
VITE_API_URL=https://your-render-backend.onrender.com/api
```

4. Deploy. The included [frontend/vercel.json](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/frontend/vercel.json) ensures React routes work on refresh.

### Backend on Render

1. Create a new Web Service on Render from the same repo.
2. Set the root directory to `backend`.
3. Build command:

```text
npm install
```

4. Start command:

```text
node server.js
```

5. Add backend environment variables from [backend/.env.example](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/backend/.env.example).
6. Set `CLIENT_URLS` to include your Vercel domain.

Optional:
- Use [render.yaml](/C:/Users/MSV/Desktop/Task%20Management%20WebSite/render.yaml) for Render blueprint-based setup.
- Use Cloudinary for production file uploads so uploaded documents are not tied to temporary local disk storage.
