# RideGo - Travel App (Rapido-like)

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication and role-based access (Rider vs Driver)
- Ride booking flow: enter pickup and drop location, choose vehicle type (Bike, Auto, Cab)
- Fare estimation based on vehicle type
- Ride request management: request, accept, start, complete, cancel
- Driver dashboard: view available ride requests, accept/reject rides
- Rider dashboard: book a ride, track ride status
- Ride history for both riders and drivers
- Driver registration with vehicle details
- Rating system for rides

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. User profile management (name, phone, role: rider/driver)
2. Driver registration with vehicle info (type, plate number)
3. Ride data model: rideId, rider, driver, pickup, drop, vehicle type, status, fare, timestamp, rating
4. Functions:
   - registerDriver(vehicleType, plateNumber) -> Result
   - bookRide(pickup, dropLocation, vehicleType) -> Result<RideId>
   - getAvailableRides() -> [Ride] (for drivers)
   - acceptRide(rideId) -> Result
   - updateRideStatus(rideId, status) -> Result (start, complete, cancel)
   - getRideHistory() -> [Ride]
   - rateRide(rideId, rating) -> Result
   - getMyProfile() -> Profile
   - updateProfile(name, phone) -> Result

### Frontend (React)
1. Landing / Home page with role selection (I want to ride / I want to drive)
2. Rider flow:
   - Book ride page: enter pickup, drop, select vehicle type, see fare estimate
   - Ride status page: show current ride status with driver details
   - Ride history page
3. Driver flow:
   - Registration page: vehicle type, plate number
   - Available rides feed: list of ride requests to accept
   - Active ride page: show rider info, navigation actions (start/complete)
   - Ride history page
4. Shared:
   - Profile page (name, phone, rating)
   - Top navigation with role context
