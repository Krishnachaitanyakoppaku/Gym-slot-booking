# IIITDM Gym Booking System

## About

This project is a **Gym Slot Booking Application** designed to streamline the process of reserving gym slots. It provides a user-friendly interface for members to book available time slots and a robust admin dashboard for managing bookings, users, and gym capacity.

**Key Features:**

*   **User Authentication:** Secure login and registration for gym members.
*   **Slot Booking:** Intuitive interface to view available slots and make reservations.
*   **Booking Management:** Users can view and manage their upcoming bookings.
*   **Admin Dashboard:** Comprehensive tools for administrators to oversee slots, user accounts, and booking data.
*   **Announcements & Feedback:** Features for gym management to communicate with users and collect feedback.

**Technologies Used:**

*   **Frontend:** React (TypeScript)
*   **Backend:** Supabase (PostgreSQL Database, Authentication, and Realtime services)

**Live Demo:** [https://gym-slot-booking.vercel.app/](https://gym-slot-booking.vercel.app/)

---

## 🎯 **Features**

### **For Students**

- 📅 **Visual Slot Booking** - Interactive calendar with color-coded availability
- 👤 **User Authentication** - Secure login with institute email
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 📋 **Booking Management** - View and cancel your bookings
- 💬 **Feedback System** - Submit feedback and complaints
- 🏋️ **Exercise Guidance** - Built-in workout instructions

### **For Administrators**

- 🎛️ **Admin Dashboard** - Comprehensive slot management interface
- 🔄 **Slot Toggle** - Block/unblock slots with visual feedback
- 👥 **User Management** - View bookings and user details
- 📊 **Feedback Management** - Review and respond to user feedback
- 📈 **Analytics** - Booking statistics and capacity monitoring

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### **Installation**

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gym-booking-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Set up database**

   - Follow instructions in `backend/SUPABASE_SETUP.md`
   - Run SQL files in `backend/database/` folder

5. **Start the application**
   ```bash
   npm start
   ```

## 📁 **Project Structure**

```
gym-booking-system/
├── src/
│   ├── components/          # React components
│   │   ├── Login.tsx       # Authentication
│   │   ├── Home.tsx        # User dashboard
│   │   ├── Booking.tsx     # Slot booking interface
│   │   ├── AdminDashboard.tsx # Admin management
│   │   └── ...
│   ├── services/           # API services
│   │   ├── authService.ts  # Authentication logic
│   │   ├── slotService.ts  # Slot management
│   │   ├── bookingService.ts # Booking operations
│   │   └── feedbackService.ts # Feedback handling
│   ├── contexts/           # React contexts
│   ├── lib/               # Utilities and configuration
│   └── global.css         # Styling
├── backend/               # Backend configuration
│   ├── database/         # SQL schema and setup
│   ├── SUPABASE_SETUP.md # Database setup guide
│   └── README.md         # Backend documentation
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## 🎨 **User Interface**

### **Booking Interface**

- **Green slots** - Available for booking
- **Orange slots** - Filling fast (60%+ capacity)
- **Red slots** - Full capacity
- **Gray slots** - Blocked by admin

### **Admin Interface**

- **Visual slot grid** - Same layout as user interface
- **Click to view details** - See bookings and user feedback
- **Toggle buttons** - Block/unblock slots instantly
- **Feedback management** - Review and update feedback status

## 🔐 **Authentication**

### **Student Login**

- Use institute email (`@iiitdm.ac.in`)
- Password-based authentication
- Google OAuth integration

### **Admin Login**

- **Email**: `admin@iiitdm.ac.in`
- **Password**: `admin123`
- Access to admin dashboard at `/admin/dashboard`

## 🛠️ **Technology Stack**

- **Frontend**: React 18, TypeScript, React Router
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: CSS3 with responsive design
- **State Management**: React Context API
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Row Level Security

## 📱 **Responsive Design**

The application is fully responsive and works on:

- 💻 **Desktop** - Full feature set
- 📱 **Mobile** - Optimized touch interface
- 📟 **Tablet** - Adaptive layout

## 🔧 **Configuration**

### **Environment Variables**

```env
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **Database Setup**

See `backend/README.md` for detailed database configuration instructions.

## 🚀 **Deployment**

### **Frontend Deployment**

```bash
npm run build
# Deploy the build/ folder to your hosting service
```

### **Recommended Hosting**

- **Vercel** - Automatic deployments from Git
- **Netlify** - Easy static site hosting
- **GitHub Pages** - Free hosting for public repos

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏫 **About IIITDM Kancheepuram**

This system is designed for the Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram - a premier technical institution focused on design and manufacturing.

## 📞 **Support**

For technical support or questions:

- Check the documentation in `backend/`
- Review the troubleshooting guides
- Contact the development team

---
