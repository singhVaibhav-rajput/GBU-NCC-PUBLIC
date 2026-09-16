# 37 UP Battalion NCC -- Gautam Buddha University

A full-stack web application and administration portal for the **37 UP
Battalion NCC at Gautam Buddha University**.

The project provides a public-facing NCC website for students and
visitors, along with a protected administration panel for managing
website content and NCC student information.

------------------------------------------------------------------------

## 📌 Project Overview

This website is designed to provide a centralized digital platform for
the NCC unit at Gautam Buddha University.

### Public Website

Visitors can:

-   Learn about the NCC unit
-   Explore NCC activities
-   View achievements and recognitions
-   View NCC leadership and coordination information
-   Access notices and other published information
-   View NCC-related content and images

### Admin Panel

Authorized administrators can:

-   Log in securely to the administration panel
-   View the NCC dashboard
-   Manage notices
-   Manage activities
-   Manage achievements
-   Manage NCC student profiles
-   Manage NCC vacancies
-   View NCC statistics
-   Update website content without modifying the public pages manually

------------------------------------------------------------------------

## ✨ Features

### 🌐 Public Website

-   Responsive homepage
-   Hero section with NCC branding
-   About NCC section
-   Activities showcase
-   Achievements showcase
-   Leadership and guidance section
-   NCC coordinator information
-   Notices and other public content
-   Image-based content sections
-   Responsive design for desktop, tablet and mobile devices

### 🔐 Administration Panel

-   Protected admin authentication
-   Admin dashboard
-   NCC statistics dashboard
-   Notice management
-   Activity management
-   Achievement management
-   Student management
-   Vacancy management
-   Content management through dedicated admin routes
-   Session-based authentication

### 📊 NCC Statistics

The administration dashboard provides NCC-related statistics such as:

-   Total Students
-   Vacancies
-   NCC Completed
-   NCC Ongoing
-   C Certificate Ongoing

These statistics can be used to give administrators a quick overview of
the current NCC data.

------------------------------------------------------------------------

## 🛠️ Tech Stack

### Frontend

-   HTML5
-   EJS
-   Tailwind CSS
-   JavaScript

### Backend

-   Node.js
-   Express.js
-   Express Session
-   EJS Mate

### Database / Backend Services

-   Supabase
-   PostgreSQL through Supabase

### Other Tools & Packages

-   dotenv
-   Multer
-   Method Override
-   Tailwind CSS CLI

------------------------------------------------------------------------

## 📁 Project Structure

``` text
ncc_web_wso/
│
├── config/
│   └── Database and application configuration
│
├── middleware/
│   └── Authentication and request middleware
│
├── public/
│   ├── css/
│   │   ├── input.css
│   │   └── style.css
│   │
│   ├── images/
│   │   ├── about/
│   │   ├── achievements/
│   │   ├── activities/
│   │   ├── hero/
│   │   └── logos/
│   │
│   └── js/
│
├── routes/
│   ├── admin.js
│   └── Other application routes
│
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   └── Admin management pages
│   │
│   ├── layouts/
│   │   ├── boilerplate.ejs
│   │   └── admin.ejs
│   │
│   └── partials/
│
├── app.js
├── package.json
├── package-lock.json
├── .env
└── README.md
```

> `node_modules/` is created automatically after installing dependencies
> and should not be committed to Git.

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Clone the Repository

``` bash
git clone https://github.com/singhVaibhav-rajput/ncc_web_wso.git
cd ncc_web_wso
```

If the repository URL is different, replace it with your actual Git
remote.

------------------------------------------------------------------------

### 2. Install Dependencies

``` bash
npm install
```

------------------------------------------------------------------------

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

``` env
PORT=3000

SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_key

SESSION_SECRET=your_session_secret
```

Use the variable names expected by your application's configuration
files.

**Do not commit `.env` to GitHub.**

Add it to `.gitignore`:

``` gitignore
node_modules/
.env
```

------------------------------------------------------------------------

## 🎨 Tailwind CSS

This project uses Tailwind CSS v4 with the Tailwind CLI.

### Development

Run the Tailwind watcher:

``` bash
npm run dev:css
```

This watches:

``` text
public/css/input.css
```

and generates:

``` text
public/css/style.css
```

### Production CSS Build

Before deployment, generate the production CSS:

``` bash
npm run build:css
```

------------------------------------------------------------------------

## ▶️ Run the Application

Start the Express server:

``` bash
npm start
```

The application will normally be available at:

``` text
http://localhost:3000
```

The server uses:

``` js
const PORT = process.env.PORT || 3000;
```

This allows deployment platforms to provide their own `PORT` environment
variable.

------------------------------------------------------------------------

## 🔗 Main Routes

### Public Routes

  Route             Purpose
  ----------------- ---------------------
  `/`               Public NCC homepage
  `/about`          NCC information
  `/activities`     NCC activities
  `/achievements`   NCC achievements

Additional public routes can be added as the project grows.

### Admin Routes

  Route                   Purpose
  ----------------------- ------------------------
  `/admin`                Admin dashboard
  `/admin/notices`        Notice management
  `/admin/activities`     Activity management
  `/admin/achievements`   Achievement management
  `/admin/students`       Student management
  `/admin/vacancies`      Vacancy management

The exact available routes depend on the route modules currently
registered in `app.js`.

------------------------------------------------------------------------

## 🔐 Authentication

The administration panel is protected by authentication middleware.

For example, the admin dashboard uses:

``` js
router.get("/", adminAuth, (req, res) => {
    res.render("admin/dashboard");
});
```

This prevents unauthenticated users from directly accessing protected
admin pages.

Authentication/session configuration should be kept server-side and
sensitive credentials should be stored in environment variables.

------------------------------------------------------------------------

## 🗄️ Supabase

The project uses Supabase for backend data storage.

Supabase can be used for application data such as:

-   Students
-   Notices
-   Activities
-   Achievements
-   Vacancies
-   Other NCC-related records

The application connects to Supabase through:

``` text
@supabase/supabase-js
```

Make sure the required Supabase environment variables are configured
before starting the application.

------------------------------------------------------------------------

## 🖼️ Images

Static images are stored inside:

``` text
public/images/
```

Current image categories include:

``` text
public/images/
├── about/
├── achievements/
├── activities/
├── hero/
└── logos/
```

Images can be referenced from EJS templates using paths such as:

``` html
<img src="/images/hero/main.jpg" alt="NCC Cadets">
```

------------------------------------------------------------------------

## 📦 package.json

The project uses Node.js and CommonJS.

Important scripts:

``` json
{
  "scripts": {
    "dev:css": "npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/style.css --watch",
    "build:css": "npx @tailwindcss/cli -i ./public/css/input.css -o ./public/css/style.css",
    "start": "node app.js"
  }
}
```

The project is configured for Node.js 24.x:

``` json
"engines": {
  "node": "24.x"
}
```

------------------------------------------------------------------------

## 🌍 Deployment

The application is suitable for deployment on platforms that support
Node.js/Express applications.

A typical production deployment should:

1.  Connect the GitHub repository
2.  Install dependencies with `npm install`
3.  Build Tailwind CSS with:

``` bash
npm run build:css
```

4.  Start the server with:

``` bash
npm start
```

5.  Add all required environment variables in the hosting platform
6.  Ensure the application listens on the platform-provided `PORT`

### Important

Do not upload:

-   `.env`
-   `node_modules/`
-   Supabase secret keys
-   Session secrets
-   Other private credentials

------------------------------------------------------------------------

## 🧑‍💻 Development Workflow

A typical development workflow is:

``` bash
# Install dependencies
npm install

# Start Tailwind in watch mode
npm run dev:css

# In another terminal, start Express
npm start
```

After making changes:

``` bash
git status
git add .
git commit -m "Update NCC website"
git push origin main
```

------------------------------------------------------------------------

## 🔄 Application Architecture

The application follows a server-rendered Express + EJS architecture.

``` text
Browser
   │
   ▼
Express.js
   │
   ├── Public Routes
   │       │
   │       ▼
   │     EJS Views
   │
   └── Admin Routes
           │
           ▼
      Authentication
           │
           ▼
       Admin Views
           │
           ▼
        Supabase
```

Static assets such as CSS, JavaScript and images are served from the
`public/` directory.

------------------------------------------------------------------------

## 🎯 Project Goals

The main goals of this project are:

-   Digitize NCC website content
-   Provide an easy-to-use public information portal
-   Give NCC administrators a centralized management system
-   Maintain student-related information
-   Publish notices, activities and achievements
-   Provide NCC statistics to administrators
-   Create a maintainable foundation for future NCC features

------------------------------------------------------------------------

## 🔮 Future Improvements

Possible future improvements include:

-   Advanced student search and filtering
-   Student profile pages
-   QR-based student identification
-   Digital NCC certificates
-   Attendance management
-   Event registration
-   Photo gallery management
-   Notice notifications
-   Admin role management
-   Dashboard charts and analytics
-   Improved mobile admin experience
-   Cloud image storage
-   Automated backups
-   Custom domain
-   SEO improvements
-   Accessibility improvements

------------------------------------------------------------------------

## 👨‍💻 Developer

**Vaibhav Rajput**

Integrated B.Tech--M.Tech in Computer Science & Engineering\
Gautam Buddha University

### Skills Used in This Project

-   HTML
-   CSS
-   Tailwind CSS
-   JavaScript
-   Node.js
-   Express.js
-   EJS
-   Supabase
-   Git & GitHub

------------------------------------------------------------------------

## 📄 License

This project is currently intended for the **37 UP Battalion NCC, Gautam
Buddha University**.

The license and usage terms can be formally defined as the project is
prepared for wider distribution.

------------------------------------------------------------------------

## ⭐ Acknowledgement

Developed for the digital presence and management of the **37 UP
Battalion NCC at Gautam Buddha University**.

**Unity • Discipline • Leadership**
