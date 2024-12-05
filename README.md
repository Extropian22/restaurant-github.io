# Cozy Corner Cafe - Full Stack Restaurant Website

A modern, full-stack restaurant management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🌟 Features

- 🔐 User Authentication & Authorization
- 🍽️ Menu Management
- 📅 Reservation System
- 🛒 Online Ordering
- 💳 Payment Processing (Stripe)
- ⭐ Customer Reviews
- 📱 Responsive Design
- 📊 Admin Dashboard
- 📧 Email Notifications
- 🖼️ Image Upload

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Stripe Account (for payments)
- Email Service Provider

### Installation

1. Clone the repository:
```bash
git clone https://github.com/314-hash/retaurant-github.io.git
cd retaurant-github.io
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create environment files:

Server (.env):
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

Client (.env):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

5. Start the development servers:

Server:
```bash
cd server
npm run dev
```

Client:
```bash
cd client
npm start
```

## 🏗️ Architecture

### Backend

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payment**: Stripe
- **Validation**: Express Validator

### Frontend

- **Framework**: React.js
- **State Management**: Redux Toolkit
- **UI Framework**: Material-UI
- **Forms**: Formik
- **HTTP Client**: Axios
- **Payment UI**: Stripe Elements

## 📁 Project Structure

```
cozy-corner-cafe/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── redux/
│       ├── services/
│       └── utils/
└── server/                 # Node.js backend
    ├── src/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── services/
    │   └── utils/
    └── uploads/            # File uploads
```

## 🔒 Security Features

- JWT Authentication
- Password Hashing
- Input Validation
- XSS Protection
- CORS Configuration
- Rate Limiting
- File Upload Validation
- Secure Payment Processing

## 🚀 Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Set up environment variables on your hosting platform

3. Deploy the server and client to your preferred hosting service

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Your Name - [@314-hash](https://github.com/314-hash)

Project Link: [https://github.com/314-hash/retaurant-github.io](https://github.com/314-hash/retaurant-github.io)
