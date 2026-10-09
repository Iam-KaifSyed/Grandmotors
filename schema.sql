CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  email TEXT,
  vehicleMake TEXT NOT NULL,
  vehicleModel TEXT NOT NULL,
  registrationNumber TEXT NOT NULL,
  serviceCategory TEXT NOT NULL,
  specificService TEXT,
  preferredDate TEXT NOT NULL,
  preferredTime TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  additionalMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
