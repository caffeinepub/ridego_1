# RideGo

## Current State
RideGo is a full-stack ride-sharing app (Rapido-style) with:
- Rider and Driver roles selectable from a home screen
- Rider: booking rides (Sports Car, Auto, Cab), UPI/Cash/Wallet payments, live route map, turn-by-turn directions, ETA, waiting charges, cancellation fees, SOS, chat/call with driver, ride bills (PDF/share), ride history with filters/export
- Driver: online toggle, accept/reject rides, earnings dashboard, commission deduction, blocked account if rated below 2
- Shared: notifications, profile page, blocked drivers management, weekly happy-customer banner
- All state is localStorage-based (no real backend authentication)

## Requested Changes (Diff)

### Add
- **Admin Panel** -- a separate admin view accessible from the home screen with a hardcoded admin login (e.g. admin / admin123)
- Admin dashboard with overview stats: total rides, total riders, total drivers, total earnings, total commission collected
- **Riders management table**: list of all riders with name, phone, ride count, status (Active/Blocked), actions to block/unblock
- **Drivers management table**: list of all drivers with name, phone, vehicle type, ride count, earnings, commission deducted, rating, status (Active/Blocked/Restricted), actions to block/unblock
- **All Rides table**: list of all rides with date, rider, driver, vehicle, fare, payment method, status (Completed/Cancelled), actions to view bill
- **Commission report**: summary of commission collected per driver, total commission, downloadable as CSV
- **Blocked drivers section**: view and manage all currently blocked drivers
- Admin nav: Dashboard, Riders, Drivers, Rides, Commission tabs
- Admin logout button to return to home screen

### Modify
- Home screen: add a small "Admin" link/button below the main CTAs to access admin login
- App.tsx View type: add "admin-login" and "admin-panel" views
- App.tsx: handle admin login/logout navigation

### Remove
- Nothing removed

## Implementation Plan
1. Create `AdminLogin.tsx` -- a centered login form with username/password fields; hardcoded credentials admin/admin123; on success navigate to admin-panel view
2. Create `AdminPanel.tsx` -- full admin panel with:
   - Top nav with RideGo logo + "Admin Panel" label + logout button
   - Tab navigation: Dashboard | Riders | Drivers | Rides | Commission
   - Dashboard tab: stat cards (total rides, riders, drivers, earnings, commission)
   - Riders tab: table with mock rider data, block/unblock toggle
   - Drivers tab: table with mock driver data, status badges, block/unblock toggle, rating display
   - Rides tab: all rides table with filters by status/vehicle, view bill button
   - Commission tab: per-driver commission breakdown, total, CSV export button
3. Update `App.tsx`:
   - Add "admin-login" and "admin-panel" to View type
   - Add pageTitle entries for new views
   - Add admin login handler (hardcoded check)
   - Render AdminLogin and AdminPanel at appropriate views
   - Add "Admin" text link on home screen below the main CTAs
   - Admin views skip the normal header/nav layout and render full-screen
