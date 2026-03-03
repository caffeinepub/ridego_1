import AccessControl "./authorization/access-control";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

import MixinAuthorization "./authorization/MixinAuthorization";

persistent actor RideGo {

  // ─── Result type ──────────────────────────────────────────────────────────
  type Result<T, E> = { #ok : T; #err : E };

  // ─── Types ────────────────────────────────────────────────────────────────

  public type VehicleType = { #Bike; #Auto; #Cab };

  public type RideStatus = {
    #Pending;
    #Accepted;
    #InProgress;
    #Completed;
    #Cancelled;
  };

  public type UserRole = { #Rider; #Driver };

  public type UserProfile = {
    name : Text;
    phone : Text;
    role : UserRole;
    vehicleType : ?VehicleType;
    plateNumber : ?Text;
    rideCount : Nat;
  };

  public type Ride = {
    id : Nat;
    rider : Principal;
    driver : ?Principal;
    pickup : Text;
    drop : Text;
    vehicleType : VehicleType;
    status : RideStatus;
    fare : Nat;
    timestamp : Int;
    riderRating : ?Nat;
    driverRating : ?Nat;
  };

  // ─── State ────────────────────────────────────────────────────────────────

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextRideId : Nat = 1;
  let profiles = Map.empty<Principal, UserProfile>();
  let rides = Map.empty<Nat, Ride>();

  // ─── Helpers ──────────────────────────────────────────────────────────────

  func textToVehicleType(t : Text) : ?VehicleType {
    if (t == "Bike") ?#Bike
    else if (t == "Auto") ?#Auto
    else if (t == "Cab") ?#Cab
    else null
  };

  func baseFare(v : VehicleType) : Nat {
    switch v {
      case (#Bike) 30;
      case (#Auto) 50;
      case (#Cab) 80;
    }
  };

  func allRides() : [Ride] {
    Array.fromIter(rides.values())
  };

  func allProfiles() : [UserProfile] {
    Array.fromIter(profiles.values())
  };

  // ─── Profile ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func updateProfile(name : Text, phone : Text, roleText : Text) : async Result<UserProfile, Text> {
    let role : UserRole = if (roleText == "Driver") #Driver else #Rider;
    let existing = profiles.get(caller);
    let updated : UserProfile = {
      name;
      phone;
      role;
      vehicleType = switch existing { case (?p) p.vehicleType; case null null };
      plateNumber = switch existing { case (?p) p.plateNumber; case null null };
      rideCount = switch existing { case (?p) p.rideCount; case null 0 };
    };
    profiles.add(caller, updated);
    #ok(updated)
  };

  public query ({ caller }) func getMyProfile() : async Result<UserProfile, Text> {
    switch (profiles.get(caller)) {
      case (?p) #ok(p);
      case null #err("Profile not found");
    }
  };

  // ─── Driver Registration ──────────────────────────────────────────────────

  public shared ({ caller }) func registerAsDriver(vehicleTypeText : Text, plateNumber : Text) : async Result<UserProfile, Text> {
    switch (textToVehicleType(vehicleTypeText)) {
      case null #err("Invalid vehicle type. Use Bike, Auto, or Cab");
      case (?vt) {
        let existing = profiles.get(caller);
        let updated : UserProfile = {
          name = switch existing { case (?p) p.name; case null "" };
          phone = switch existing { case (?p) p.phone; case null "" };
          role = #Driver;
          vehicleType = ?vt;
          plateNumber = ?plateNumber;
          rideCount = switch existing { case (?p) p.rideCount; case null 0 };
        };
        profiles.add(caller, updated);
        #ok(updated)
      };
    }
  };

  // ─── Fare Estimation ─────────────────────────────────────────────────────

  public query func estimateFare(_pickup : Text, _drop : Text, vehicleTypeText : Text) : async Result<Nat, Text> {
    switch (textToVehicleType(vehicleTypeText)) {
      case null #err("Invalid vehicle type");
      case (?vt) #ok(baseFare(vt));
    }
  };

  // ─── Ride Booking ─────────────────────────────────────────────────────────

  public shared ({ caller }) func bookRide(pickup : Text, drop : Text, vehicleTypeText : Text) : async Result<Nat, Text> {
    switch (textToVehicleType(vehicleTypeText)) {
      case null #err("Invalid vehicle type");
      case (?vt) {
        let id = nextRideId;
        nextRideId += 1;
        let ride : Ride = {
          id;
          rider = caller;
          driver = null;
          pickup;
          drop;
          vehicleType = vt;
          status = #Pending;
          fare = baseFare(vt);
          timestamp = Time.now();
          riderRating = null;
          driverRating = null;
        };
        rides.add(id, ride);
        #ok(id)
      };
    }
  };

  // ─── Driver: View Available Rides ─────────────────────────────────────────

  public query func getAvailableRides() : async [Ride] {
    allRides().filter(func(r : Ride) : Bool { r.status == #Pending })
  };

  // ─── Driver: Accept Ride ──────────────────────────────────────────────────

  public shared ({ caller }) func acceptRide(rideId : Nat) : async Result<Ride, Text> {
    switch (rides.get(rideId)) {
      case null #err("Ride not found");
      case (?ride) {
        if (ride.status != #Pending) return #err("Ride is no longer available");
        let updated : Ride = {
          id = ride.id;
          rider = ride.rider;
          driver = ?caller;
          pickup = ride.pickup;
          drop = ride.drop;
          vehicleType = ride.vehicleType;
          status = #Accepted;
          fare = ride.fare;
          timestamp = ride.timestamp;
          riderRating = ride.riderRating;
          driverRating = ride.driverRating;
        };
        rides.add(rideId, updated);
        #ok(updated)
      };
    }
  };

  // ─── Driver: Start Ride ───────────────────────────────────────────────────

  public shared ({ caller }) func startRide(rideId : Nat) : async Result<Ride, Text> {
    switch (rides.get(rideId)) {
      case null #err("Ride not found");
      case (?ride) {
        let isDriver = switch (ride.driver) { case (?d) Principal.equal(d, caller); case null false };
        if (not isDriver) return #err("Not your ride");
        if (ride.status != #Accepted) return #err("Ride must be accepted first");
        let updated : Ride = {
          id = ride.id; rider = ride.rider; driver = ride.driver;
          pickup = ride.pickup; drop = ride.drop; vehicleType = ride.vehicleType;
          status = #InProgress; fare = ride.fare; timestamp = ride.timestamp;
          riderRating = ride.riderRating; driverRating = ride.driverRating;
        };
        rides.add(rideId, updated);
        #ok(updated)
      };
    }
  };

  // ─── Driver: Complete Ride ────────────────────────────────────────────────

  public shared ({ caller }) func completeRide(rideId : Nat) : async Result<Ride, Text> {
    switch (rides.get(rideId)) {
      case null #err("Ride not found");
      case (?ride) {
        let isDriver = switch (ride.driver) { case (?d) Principal.equal(d, caller); case null false };
        if (not isDriver) return #err("Not your ride");
        if (ride.status != #InProgress) return #err("Ride must be in progress");
        let updated : Ride = {
          id = ride.id; rider = ride.rider; driver = ride.driver;
          pickup = ride.pickup; drop = ride.drop; vehicleType = ride.vehicleType;
          status = #Completed; fare = ride.fare; timestamp = ride.timestamp;
          riderRating = ride.riderRating; driverRating = ride.driverRating;
        };
        rides.add(rideId, updated);
        switch (profiles.get(ride.rider)) {
          case (?rp) {
            profiles.add(ride.rider, {
              name = rp.name; phone = rp.phone; role = rp.role;
              vehicleType = rp.vehicleType; plateNumber = rp.plateNumber;
              rideCount = rp.rideCount + 1
            });
          };
          case null {};
        };
        switch (ride.driver) {
          case (?dp) {
            switch (profiles.get(dp)) {
              case (?drp) {
                profiles.add(dp, {
                  name = drp.name; phone = drp.phone; role = drp.role;
                  vehicleType = drp.vehicleType; plateNumber = drp.plateNumber;
                  rideCount = drp.rideCount + 1
                });
              };
              case null {};
            };
          };
          case null {};
        };
        #ok(updated)
      };
    }
  };

  // ─── Cancel Ride ─────────────────────────────────────────────────────────

  public shared ({ caller }) func cancelRide(rideId : Nat) : async Result<Ride, Text> {
    switch (rides.get(rideId)) {
      case null #err("Ride not found");
      case (?ride) {
        let isRider = Principal.equal(ride.rider, caller);
        let isDriver = switch (ride.driver) { case (?d) Principal.equal(d, caller); case null false };
        if (not isRider and not isDriver) return #err("Not authorized");
        if (ride.status == #Completed or ride.status == #Cancelled) return #err("Cannot cancel this ride");
        let updated : Ride = {
          id = ride.id; rider = ride.rider; driver = ride.driver;
          pickup = ride.pickup; drop = ride.drop; vehicleType = ride.vehicleType;
          status = #Cancelled; fare = ride.fare; timestamp = ride.timestamp;
          riderRating = ride.riderRating; driverRating = ride.driverRating;
        };
        rides.add(rideId, updated);
        #ok(updated)
      };
    }
  };

  // ─── Rate Ride ────────────────────────────────────────────────────────────

  public shared ({ caller }) func rateRide(rideId : Nat, rating : Nat) : async Result<Ride, Text> {
    if (rating < 1 or rating > 5) return #err("Rating must be between 1 and 5");
    switch (rides.get(rideId)) {
      case null #err("Ride not found");
      case (?ride) {
        if (ride.status != #Completed) return #err("Can only rate completed rides");
        let isRider = Principal.equal(ride.rider, caller);
        let isDriver = switch (ride.driver) { case (?d) Principal.equal(d, caller); case null false };
        if (not isRider and not isDriver) return #err("Not authorized");
        let updated : Ride = {
          id = ride.id; rider = ride.rider; driver = ride.driver;
          pickup = ride.pickup; drop = ride.drop; vehicleType = ride.vehicleType;
          status = ride.status; fare = ride.fare; timestamp = ride.timestamp;
          riderRating = if isRider ?rating else ride.riderRating;
          driverRating = if isDriver ?rating else ride.driverRating;
        };
        rides.add(rideId, updated);
        #ok(updated)
      };
    }
  };

  // ─── Ride History ─────────────────────────────────────────────────────────

  public query ({ caller }) func getMyRides() : async [Ride] {
    allRides().filter(func(r : Ride) : Bool {
      Principal.equal(r.rider, caller) or
      (switch (r.driver) { case (?d) Principal.equal(d, caller); case null false })
    })
  };

  public query ({ caller }) func getActiveRide() : async ?Ride {
    let active = allRides().filter(func(r : Ride) : Bool {
      let isParticipant = Principal.equal(r.rider, caller) or
        (switch (r.driver) { case (?d) Principal.equal(d, caller); case null false });
      let isActive = r.status == #Pending or r.status == #Accepted or r.status == #InProgress;
      isParticipant and isActive
    });
    if (active.size() > 0) ?active[0] else null
  };

  // ─── Drivers List ─────────────────────────────────────────────────────────

  public query func getAllDrivers() : async [UserProfile] {
    allProfiles().filter(func(p : UserProfile) : Bool { p.role == #Driver })
  };
};
