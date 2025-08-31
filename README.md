# Flight Simulator Training Devices (FSTD) Tracking System

A comprehensive web-based management system designed for aviation training organizations to track, manage, and maintain flight simulator certifications and regulatory compliance.

## 🚀 Overview

The Flight Simulator Tracking System (FSTS) is a robust enterprise application built to streamline the complex process of managing flight simulator certifications across multiple regulatory authorities (GACA and EASA). The system facilitates seamless collaboration between engineers, managers, and finance departments while ensuring compliance with aviation safety standards.

## ✨ Key Features

- **🔐 Role-Based Access Control**: Secure authentication system with distinct permissions for Engineers, Managers, and Finance personnel
- **📋 Certification Management**: Track initial and recurrent certifications for flight simulators
- **📊 Dashboard Analytics**: Real-time overview of simulator statuses, expiring certifications, and active requests
- **📨 Automated Workflows**: Streamlined request processes from engineers to regulatory authorities
- **💸 Bill Management**: Integrated finance tracking for certification-related expenses
- **📄 Document Management**: Secure file upload and storage for regulatory documentation
- **📧 Email Integration**: Automated notifications and communication system

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Security**: Firebase Security Rules with role-based access control
- **Email Service**: EmailJS for automated notifications
- **Image Hosting**: ImgBB for simulator image storage
- **UI Components**: Select2, Font Awesome.

## 👥 User Roles

### Engineer
- Submit certification requests to managers
- View personal request history
- Track simulator certification statuses
- Upload required documentation
- Check evaluation date information

### Manager
- Review all the engineers' requests
- Submit requests to regulatory authorities (GACA/EASA)
- Generate evaluation forms
- Monitor all organizational requests

### Finance
- Manage bill payments and tracking
- Update payment statuses
- Financial reporting for certification costs

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-organization/fsts.git
   cd fsts
   ```

2. **Firebase Configuration**
   - Create a new Firebase project
   - Enable Authentication, Firestore, and Storage
   - Update Firebase config in `firebaseConfig.js`
   - Set up Security Rules (provided in security-rules.txt)

3. **EmailJS Setup**
   - Create an EmailJS account
   - Configure email templates for notifications
   - Update service IDs in relevant components

4. **Deployment**
   - Deploy to preferred web server

---

**Note**: This system is specifically designed for aviation industry use and requires proper regulatory compliance understanding for effective implementation.
