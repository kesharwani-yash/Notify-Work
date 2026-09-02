# Notify-work

> A digital order management and customer notification system designed for local businesses to manage customer work requests and notify customers when their work is ready.

## 📌 Overview

**Notify-work** is a web-based order/work management system built to solve a common problem faced by local businesses such as flour mills, printing shops, repair shops, laundries, and other service-based businesses.

In many local businesses, customers submit their work and are asked to wait or return later to collect it. The business owner has to manually keep track of requests and customers often have no way of knowing when their work is completed.

Notify-work provides a digital workflow where:

**Customer submits request → Business owner manages request → Work is completed → Customer is notified → Customer collects the work**

The system aims to reduce manual work, improve order tracking, and provide a better customer experience.

---

## 🎯 Problem Statement

Traditional local-business workflows often rely on:

* Paper-based order records
* Verbal communication
* Manual phone calls
* Customers repeatedly visiting or calling the shop
* Difficulty tracking pending and completed work
* No centralized order history

For example, at a flour mill, a customer may submit wheat for grinding and leave the shop. The customer then has to either call the shop or visit again to check whether the flour is ready.

**Notify-work solves this by digitizing the request and notification workflow.**

---

## 💡 Solution

Notify-work provides two primary interfaces:

### 👤 Customer

The customer can:

1. Scan the shop's QR code.
2. Open the digital request form.
3. Enter required information.
4. Submit the request.
5. Receive notification when the work is completed.
6. Visit the shop and collect the completed work.

### 🏪 Business Owner

The shop owner can:

1. View incoming requests.
2. Verify submitted information.
3. Accept or reject requests.
4. Track active orders.
5. Mark completed work as ready.
6. Notify customers.
7. View order history.
8. Remove orders after customer collection.

---

## 🔄 Application Workflow

```text
                    CUSTOMER
                       │
                       ▼
                 Scan QR Code
                       │
                       ▼
              Customer Request Form
                       │
                       ▼
                Submit Request
                       │
                       ▼
              ┌─────────────────┐
              │ Owner Dashboard │
              └─────────────────┘
                       │
                       ▼
              Verify Request
                 /          \
              Reject        Accept
                │             │
                ▼             ▼
              End       Active Order
                              │
                              ▼
                         Work Processing
                              │
                              ▼
                       Work Completed
                              │
                              ▼
                        Mark as Ready
                              │
                              ▼
                       Notify Customer
                              │
                              ▼
                     Customer Collects
                              │
                              ▼
                        Order Removed
```

---

# ✨ Key Features

## Customer Features

* QR-code-based access
* Digital request submission
* Simple customer form
* Request confirmation
* Customer contact information collection
* Work completion notification

## Business Owner Features

* Dedicated dashboard
* Incoming request management
* Request verification
* Accept/reject functionality
* Active order management
* Ready-order management
* Daily order history
* Order completion workflow
* Customer notification system

---

# 📊 Dashboard Structure

The owner dashboard is divided into different sections according to the order lifecycle.

### `/dashboard/pending`

Contains newly submitted customer requests waiting for verification.

```text
New Request
     │
     ├── Accept
     │
     └── Reject
```

---

### `/dashboard/orders`

Contains accepted/active orders that are currently being processed.

When the business owner completes the work, the order can be marked as ready.

```text
Active Order
     │
     ▼
Work Completed
     │
     ▼
Mark Ready
```

---

### `/dashboard/ready`

Contains orders whose work has been completed.

The customer can now be notified and can visit the shop to collect the order.

After collection, the owner can remove the order from the ready list.

---

### `/dashboard/history`

Contains the day's order records, providing the owner with a centralized view of completed, pending, and collected orders.

---

# 🔔 Notification System

One of the main objectives of Notify-work is to eliminate the need for customers to repeatedly call or visit the business to check whether their work is completed.

The system is designed to support notification channels such as:

* 📱 SMS
* 💬 WhatsApp
* 📞 Phone-based notification

A typical workflow is:

```text
Owner clicks "Ready"
        │
        ▼
Backend processes event
        │
        ▼
Notification Service
        │
        ├── SMS
        │
        └── WhatsApp
        │
        ▼
Customer receives notification
```

---

# 🛡️ Request Validation & Fake Request Handling

Since the customer interface can be accessed through a QR code, simply having access to the QR code should not automatically mean that every submitted request is trusted.

Notify-work addresses this at the application level by introducing an **owner verification step**.

```text
Customer Request
       │
       ▼
Pending Requests
       │
       ▼
Owner Verification
       │
   ┌───┴────┐
   ▼        ▼
Accept    Reject
   │
   ▼
Active Order
```

This prevents an unverified request from directly entering the business's active order workflow.

Future improvements can include:

* CAPTCHA
* OTP verification
* Rate limiting
* Request throttling
* Duplicate-request detection
* Device/IP-based abuse detection
* Server-side validation

---

# 🏗️ Architecture

The application follows a client-server architecture.

```text
┌─────────────────────┐
│      Customer       │
│     Web Browser     │
└──────────┬──────────┘
           │
           │ HTTP Request
           ▼
┌─────────────────────┐
│      Frontend       │
│  HTML/CSS/JS/React  │
└──────────┬──────────┘
           │
           │ REST API
           ▼
┌─────────────────────┐
│       Backend       │
│   Node.js/Express   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Database       │
│       MongoDB       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Notification Layer  │
│ SMS / WhatsApp API  │
└─────────────────────┘
```

---

# 🛠️ Tech Stack

The project is being developed using modern web technologies.

### Frontend

* HTML5
* CSS3
* JavaScript
* React.js

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* MongoDB

### Development Tools

* Git
* GitHub
* VS Code
* Postman

### External Services

* SMS API
* WhatsApp API

> The exact notification provider can be configured according to the deployment requirements and available API services.

---

# 📁 Project Structure

A possible project structure:

```text
notify-work/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── README.md
├── .gitignore
└── package.json
```

---

# 🔗 Important Routes

### Customer

| Route         | Purpose                          |
| ------------- | -------------------------------- |
| `/all/submit` | Customer request submission form |
| `/all`        | Customer request/details view    |

### Business Owner

| Route                | Purpose                     |
| -------------------- | --------------------------- |
| `/dashboard/pending` | Manage incoming requests    |
| `/dashboard/orders`  | View active orders          |
| `/dashboard/ready`   | View completed/ready orders |
| `/dashboard/history` | View order history          |

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/notify-work.git
cd notify-work
```

## 2. Install Dependencies

For the backend:

```bash
cd server
npm install
```

For the frontend:

```bash
cd ../client
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the backend directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

# Notification configuration
SMS_API_KEY=your_api_key
WHATSAPP_API_KEY=your_api_key
```

**Never commit your `.env` file to GitHub.**

---

# ▶️ Running the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

The application can then be accessed through the local development URL displayed by the frontend development server.

---

# 🔐 Security Considerations

The application should implement security measures such as:

* Server-side input validation
* Authentication for business-owner dashboard
* Authorization for protected operations
* Environment variables for secrets
* Rate limiting
* Request validation
* Protection against malicious input
* Secure API endpoints
* HTTPS in production

Customer-submitted information should never be blindly trusted by the backend.

---

# 🚀 Future Enhancements

Potential future improvements include:

### Authentication

* Business owner authentication
* JWT/session-based authentication
* Role-based access control

### Notifications

* WhatsApp notifications
* SMS notifications
* Notification delivery status
* Automatic notification retries

### Order Management

* Order search
* Order filtering
* Order statistics
* Customer order history
* Estimated completion time

### Security

* OTP verification
* CAPTCHA
* Rate limiting
* Abuse detection
* Duplicate request prevention

### Business Features

* Multiple shops/business accounts
* Multiple employees
* Business-specific QR codes
* Analytics dashboard
* Monthly reports
* Customer database

---

# 📈 Example Use Cases

Notify-work can be adapted to many local businesses.

| Business          | Example                 |
| ----------------- | ----------------------- |
| 🌾 Flour Mill     | Wheat → Flour           |
| 👕 Laundry        | Clothes → Washed/Ironed |
| 🖨️ Printing Shop | Document → Printed      |
| 🔧 Repair Shop    | Device → Repaired       |
| 👞 Shoe Repair    | Shoes → Repaired        |
| 🧵 Tailoring Shop | Clothes → Altered       |
| 📱 Mobile Repair  | Phone → Repaired        |

The underlying workflow remains:

```text
Request → Verification → Processing → Ready → Notification → Collection
```

---

# 🎯 Project Goals

The primary goals of Notify-work are:

* Digitize manual business workflows
* Reduce paperwork
* Reduce unnecessary customer visits
* Improve order tracking
* Provide timely customer notifications
* Give local businesses a simple management dashboard
* Create a reusable system that can work across different service-based businesses

---

# 📌 Current Status

🚧 **Under Development**

Core order management and dashboard workflows are being developed, with customer notification functionality planned as an integral part of the system.

---

# 👨‍💻 Author

**Yash Kesharwani**

B.Tech — Computer Science & Engineering

---

# 📄 License

This project is currently intended for educational and development purposes.

A formal open-source license can be added when the project is ready for public distribution.
