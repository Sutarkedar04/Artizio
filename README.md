# Artizio

A full-stack artist community and commission platform where artists can showcase their work, connect with an audience, and take on paid commissions.

## Features

- **Artist Profiles** – Instagram-style profile layout showcasing an artist's portfolio
- **Feed & Explore** – Browse artwork through a social feed and dedicated explore page
- **Category Filtering** – Filter artwork by category
- **Commission System** – Request, manage, and track art commissions (user side and admin side)
- **Artwork Management** – Upload, edit, and manage artwork listings
- **Account Types** – Switch between user/artist accounts
- **Admin Dashboard** – Manage commissions platform-wide
- **Authentication** – Register, login, forgot/reset password, email verification
- **Rich Animations** – GSAP-powered scroll and interaction animations (featured artworks carousel, hero sections)

## Tech Stack

**Frontend** (`client/`)
- React (Vite)
- GSAP for animation
- Context API for auth state (`AuthContext`)

**Backend** (`server/`)
- Node.js
- Express.js
- MongoDB (Mongoose)
- Cloudinary (image uploads)
- Nodemailer/email service (email verification, password reset)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Installation

\`\`\`bash
git clone <repo-url>
cd Artizio

cd client
npm install

cd ../server
npm install
\`\`\`

### Environment Variables

Create a `.env` file in `server/`:

\`\`\`
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_SERVICE_API_KEY=your_email_provider_key
\`\`\`

### Running Locally

\`\`\`bash
# Start backend
cd server
npm start

# Start frontend (in a separate terminal)
cd client
npm run dev
\`\`\`

## Project Structure

\`\`\`
Artizio/
├── client/               # React (Vite) frontend
│   └── src/
│       ├── components/
│       │   ├── common/    # Feed, Artwork cards, Modals, Navbar, Carousel
│       │   └── profile/    # Profile header, edit form, account switch
│       ├── pages/           # Feed, Explore, Profile, Commission, Auth, Admin
│       ├── contexts/         # AuthContext
│       ├── hooks/             # useArtworks
│       └── services/           # API calls
├── server/               # Express backend
│   ├── config/            # Cloudinary, DB, email config
│   ├── middleware/         # Auth, file upload
│   ├── models/              # User, Artist, Artwork, Commission, Contact
│   └── routes/               # API routes
└── README.md
\`\`\`

## Future Improvements

- Payment integration for commissions
- Direct messaging between artists and clients
- Artist analytics dashboard

## Author

Kedar — MERN Stack Developer & Artist
