# Breakthrough Research Repository System

## 📋 System Overview

A comprehensive research repository platform built with:
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + Radix UI
- **Backend**: PHP API (MVC Architecture) with MariaDB database
- **Authentication**: Custom auth with localStorage session management
- **Roles**: Admin and Publisher (researcher) user types

> [!IMPORTANT]
> **Backend Files Reference Note**
> The files in `app/backend/` are reference copies only. The actual production files are deployed to the **htdocs folder** on the XAMPP/Apache server window. Any changes made here should be copied to the htdocs folder for them to take effect.

---

## ✅ Completed Features

### Frontend
- [x] Landing page with hero section, announcements, and featured repositories
- [x] Repository browsing with advanced filtering (categories, year range, keywords)
- [x] Repository card component with skeleton loading states
- [x] Repository view modal with PDF preview
- [x] Authentication pages (login/signup)
- [x] Dark/Light theme support
- [x] Responsive navbar with user dropdown menu
- [x] Admin layout with sidebar navigation
- [x] Publisher layout with navigation

### Admin Dashboard
- [x] Dashboard statistics (users, publishers, repositories, pending)
- [x] Repository moderation (approve/reject/unpublish)
- [x] User management (view, edit, verify, delete)
- [x] Publisher management
- [x] Announcements (create, edit, delete, publish/unpublish)
- [x] Admin sidebar component

### Publisher Dashboard
- [x] My repositories page with filtering
- [x] Repository publishing form (title, abstract, categories, keywords, PDF upload)
- [x] Repository editing
- [x] Repository detail view (`/publisher/my-repository/[id]`)
- [x] Saved repository feature
- [x] Profile settings page

### Backend API ✅ (Fixed & Refactored)
- [x] MVC Architecture implemented (Models, Controllers, API endpoints)
- [x] User authentication (login, signup, password hashing)
- [x] Repository CRUD operations
- [x] Repository moderation endpoints
- [x] Category and keyword management
- [x] Announcement CRUD with notifications
- [x] View count tracking
- [x] Rating system (1-5 stars)
- [x] Like/Unlike functionality
- [x] Commenting system with nested replies
- [x] User verification system
- [x] Notification system
- [x] Filter endpoints (categories, research types)

### Database
- [x] Users table (`tbl_users`)
- [x] Repositories table (`tbl_repositories`)
- [x] Categories table (`tbl_category`)
- [x] Research types table (`tbl_research_type`)
- [x] Ratings table
- [x] Likes table
- [x] Comments table
- [x] Announcements table
- [x] Notifications table

---

## 🔄 In Progress / Partially Complete

### Admin Features
- [ ] Reports page (exists in routing but needs implementation)
- [ ] Admin settings page (exists in routing but needs content)
- [ ] Repository statistics/analytics visualization

### Publisher Features
- [ ] Publisher publish page (needs review for UX improvements)
- [ ] Plagiarism checking (API structure ready, needs integration)

### General
- [ ] About page (exists in routing, needs content)
- [ ] Email verification for new users
- [ ] Password reset functionality
- [ ] Session token-based authentication (currently using localStorage)

---

## 📝 To-Do List (Unfinished Items)

### High Priority
- [ ] **Admin Reports Page**: Implement analytics dashboard with charts for repository stats, user growth, etc.
- [ ] **Admin Settings Page**: Add system configuration options (categories, research types, site settings)
- [ ] **About Page**: Complete the about page content

### Medium Priority
- [ ] **Password Reset Flow**: Implement forgot password with email verification
- [ ] **Email Verification**: Add email verification for new user registrations
- [ ] **Profile Picture Upload**: Allow users to upload profile pictures
- [ ] **Notification Bell in Navbar**: Add notification dropdown with unread count
- [ ] **Search Improvements**: Add full-text search across repository titles and abstracts
- [ ] **Citation Generator**: Auto-generate citations in different formats (APA, MLA, Chicago)

### Low Priority
- [ ] **Export Repository List**: Allow admins to export reports as CSV/PDF
- [ ] **Batch Operations**: Allow admin to approve/reject multiple repositories at once
- [ ] **Publisher Analytics**: Show publishers their repository performance stats

---

## 💡 Improvement Suggestions

### Security Improvements
- [ ] **JWT Authentication**: Replace localStorage-based auth with JWT tokens
- [ ] **CSRF Protection**: Add CSRF tokens for API requests
- [ ] **Rate Limiting**: Implement rate limiting on API endpoints
- [ ] **Input Sanitization**: Enhance SQL injection and XSS protection
- [ ] **File Upload Security**: Add stricter PDF validation and virus scanning
- [ ] **HTTPS Enforcement**: Ensure all API calls use HTTPS

### Performance Improvements
- [ ] **Pagination on API Level**: Add cursor-based pagination for large datasets
- [ ] **Image Optimization**: Implement image compression and lazy loading
- [ ] **Caching Layer**: Add Redis/Memcached for frequently accessed data
- [ ] **Database Indexing**: Review and optimize database indexes
- [ ] **CDN for PDFs**: Serve PDFs from a CDN for faster delivery

### UX/UI Improvements
- [ ] **Loading States**: Add more skeleton loaders for better perceived performance
- [ ] **Error Boundaries**: Implement React error boundaries for graceful error handling
- [ ] **Form Validation**: Add client-side validation with real-time feedback
- [ ] **Keyboard Navigation**: Improve accessibility with keyboard shortcuts
- [ ] **Mobile App Version**: Consider React Native for mobile experience
- [ ] **Toast Notifications**: Standardize all feedback with sonner toasts
- [ ] **Breadcrumb Navigation**: Add breadcrumbs for better navigation context

### Feature Enhancements
- [ ] **Co-authorship**: Allow multiple publishers to be associated with a repository
- [ ] **Version History**: Track repository revisions and allow version comparison
- [ ] **Follow System**: Allow users to follow publishers and get updates
- [ ] **Bookmark Collections**: Let users organize saved repositories into collections
- [ ] **Related Repositories**: Show AI-powered related repository suggestions
- [ ] **Download History**: Track and display download counts
- [ ] **Advanced Filters**: Add more filter options (research type, institution, date range)
- [ ] **Repository Status Workflow**: Add "draft" state for publishers to save progress
- [ ] **Bulk Import**: Allow publishers to import multiple repositories via CSV
- [ ] **DOI Integration**: Generate and display DOI for published repositories

### Admin Enhancements
- [ ] **Audit Log**: Track all admin actions for accountability
- [ ] **Role-Based Access Control**: Add granular permissions for different admin roles
- [ ] **Email Templates**: Configure email templates for notifications
- [ ] **System Health Dashboard**: Monitor API health, database connections, error rates
- [ ] **Content Moderation Queue**: Priority-based queue with SLAs

### Developer Experience
- [ ] **API Documentation**: Add Swagger/OpenAPI documentation
- [ ] **TypeScript Strict Mode**: Enable stricter TypeScript checking
- [ ] **Unit Tests**: Add Jest/Vitest tests for components and API functions
- [ ] **E2E Tests**: Add Playwright/Cypress tests for critical user flows
- [ ] **CI/CD Pipeline**: Set up automated testing and deployment
- [ ] **Environment Configuration**: Move API endpoints to environment variables
- [ ] **Error Logging**: Integrate error tracking (Sentry, LogRocket)

---

##  Project Structure Reference

```
repository-system/
├── app/
│   ├── (authenticated)/
│   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── announcements/
│   │   │   ├── dashboard/
│   │   │   ├── moderation/
│   │   │   ├── publishers/
│   │   │   ├── reports/        # TODO: Implement
│   │   │   ├── repositories/
│   │   │   ├── settings/       # TODO: Implement
│   │   │   └── users/
│   │   └── publisher/          # Publisher dashboard pages
│   │       ├── my-repository/
│   │       ├── profile/
│   │       ├── publish/
│   │       ├── saved-repository/
│   │       └── settings/
│   ├── about/                  # TODO: Add content
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── backend/                # ⚠️ REFERENCE COPY (see note above)
│   │   ├── api/                # API endpoints (thin controllers)
│   │   │   ├── admin.php
│   │   │   ├── auth.php
│   │   │   ├── filters.php
│   │   │   ├── general.php
│   │   │   ├── notifications.php
│   │   │   └── publisher.php
│   │   ├── config/             # Database configuration
│   │   │   └── Database.php
│   │   ├── controllers/        # Business logic controllers
│   │   │   ├── AdminController.php
│   │   │   ├── AuthController.php
│   │   │   ├── FiltersController.php
│   │   │   ├── GeneralController.php
│   │   │   ├── NotificationsController.php
│   │   │   └── PublisherController.php
│   │   ├── models/             # Data models
│   │   │   ├── AnnouncementModel.php
│   │   │   ├── BaseModel.php
│   │   │   ├── FilterModel.php
│   │   │   ├── NotificationModel.php
│   │   │   ├── RepositoryModel.php
│   │   │   └── UserModel.php
│   │   ├── uploads/            # Uploaded PDFs
│   │   └── backup/             # Old monolithic PHP files
│   ├── config/                 # Frontend API configuration
│   └── repositories/           # Public repository browsing
├── components/                 # React components
│   ├── ui/                     # Shadcn UI components
│   └── [feature components]
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions
├── public/                     # Static assets
└── styles/                     # Global styles
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

---

## 📊 Database Schema Summary

| Table | Purpose |
|-------|---------|
| `tbl_users` | User accounts with role-based access |
| `tbl_repositories` | Research repository metadata and PDF paths |
| `tbl_category` | Repository categories |
| `tbl_research_type` | Types of research (thesis, survey, etc.) |
| `tbl_ratings` | User ratings for repositories |
| `tbl_likes` | User likes/bookmarks |
| `tbl_comments` | Repository comments with reply support |
| `tbl_announcements` | Admin announcements |
| `tbl_notifications` | User notification queue |

---

## 🏗️ Backend Architecture (MVC)

The backend has been refactored to follow MVC architecture:

| Layer | Purpose | Location |
|-------|---------|----------|
| **API** | Thin entry points, routing | `app/backend/api/` |
| **Controllers** | Business logic, validation | `app/backend/controllers/` |
| **Models** | Database queries, data access | `app/backend/models/` |
| **Config** | Database connection | `app/backend/config/` |

---

*Last Updated: December 30, 2025*
