CREATE TABLE IF NOT EXISTS alerts (
    -- Core Fields
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    phone VARCHAR(20),
    bloodGroup VARCHAR(5),
    phoneBattery INT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    message TEXT,
    currentMedicalIssue VARCHAR(255),

    -- Tier 1 & 3 Fields
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    notes TEXT,
    
    -- Timestamps for Analytics
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solvedTimestamp DATETIME NULL DEFAULT NULL
);
