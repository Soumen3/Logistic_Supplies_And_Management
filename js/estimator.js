/**
 * US-005 & US-006: Delivery Cost and Time Estimator (India Region)
 * Fixed: Alphabetical sorting of state/zone keys to ensure lookup success.
 */

const locationData = {
    "states": {
        "Delhi-Maharashtra": 1400,         // D before M
        "Karnataka-Maharashtra": 900,      // K before M
        "Maharashtra-West Bengal": 1900,   // M before W
        "Gujarat-Maharashtra": 500,        // G before M
        "Delhi-Karnataka": 2100,           // D before K
        "Delhi-West Bengal": 1500,         // D before W
        "Delhi-Gujarat": 950,              // D before G
        "Karnataka-Tamil Nadu": 350,       // K before T
        "Karnataka-Telangana": 570,        // K before T
        "Odisha-West Bengal": 450,         // O before W
        "Gujarat-Rajasthan": 600,          // G before R
        "Maharashtra-Tamil Nadu": 1300     // M before T
    },
    "postalZones": {
        "Maharashtra": {
            "400-411": 150,
            "400-440": 800,
            "411-440": 700
        },
        "Delhi": {
            "110-110": 20
        },
        "Karnataka": {
            "560-575": 350,
            "560-580": 420
        },
        "Gujarat": {
            "380-395": 270,
            "380-360": 220
        }
    }
};

/**
 * Helper: Parses address string to extract State and Pincode.
 */
function parseAddress(address) {
    const parts = address.split(',').map(p => p.trim());
    if (parts.length < 2) throw new Error("Invalid Address Format. Use: Street, City, State, Pincode");

    const pincode = parts[parts.length - 1];
    const state = parts[parts.length - 2];

    if (!state || isNaN(pincode)) {
        throw new Error("Could not extract State or Pincode. Ensure address ends with 'State, Pincode'");
    }

    return { state, pincode };
}

/**
 * Core Logic: Calculate Distance based on Address components
 */
function calculateDistance(senderAddr, receiverAddr) {
    const sender = parseAddress(senderAddr);
    const receiver = parseAddress(receiverAddr);
    
    // 1. Same State Logic
    if (sender.state.toLowerCase() === receiver.state.toLowerCase()) {
        const stateName = sender.state;
        
        if (sender.pincode === receiver.pincode) return 10; // Local delivery

        const zoneKey = [sender.pincode.substring(0, 3), receiver.pincode.substring(0, 3)].sort().join('-');
        
        // Find state in data (case-insensitive)
        const stateKey = Object.keys(locationData.postalZones).find(s => s.toLowerCase() === stateName.toLowerCase());
        const intraDistance = stateKey ? locationData.postalZones[stateKey][zoneKey] : null;

        return intraDistance || 50; 
    } 

    // 2. Inter-State Logic (Keys must be alphabetically sorted)
    const stateKey = [sender.state, receiver.state].sort().join('-');
    const interDistance = locationData.states[stateKey];

    if (!interDistance) {
        throw new Error(`Service not available between ${sender.state} and ${receiver.state}`);
    }

    return interDistance;
}

/**
 * US-005 & US-006: Combined Estimator
 */
function getEstimation(senderFullAddress, receiverFullAddress, weight, isExpress) {
    try {
        const distance = calculateDistance(senderFullAddress, receiverFullAddress);

        // --- COST CALCULATION (US-005) ---
        const baseRate = 3.0; 
        const weightRate = 20;
        const expressSurcharge = isExpress ? 500 : 0;
        const totalCost = (distance * baseRate) + (weight * weightRate) + expressSurcharge;

        // --- TIME CALCULATION (US-006) ---
        let days = Math.ceil(distance / 400);
        if (distance > 1000) days += 1; 
        
        if (isExpress) {
            days = Math.max(1, Math.floor(days * 0.5)); 
        }

        return {
            status: "Success",
            details: {
                distance: `${distance} km`,
                totalCost: `₹${totalCost.toFixed(2)}`,
                deliveryTime: `${days} Day(s)`,
                mode: isExpress ? "Express" : "Standard"
            }
        };

    } catch (error) {
        return { status: "Error", message: error.message };
    }
}

// --- RUNNING TESTS ---
const testCases = [
    {
        name: "Case 1: Inter-State (Standard) - Mumbai to Delhi",
        sender: "123 Marine Drive, Mumbai, Maharashtra, 400001",
        receiver: "456 Rohini, Delhi, Delhi, 110085",
        weight: 10,
        express: false
    },
    {
        name: "Case 2: Inter-State (Express) - Bangalore to Kolkata",
        sender: "789 Indiranagar, Bangalore, Karnataka, 560038",
        receiver: "101 Salt Lake, Kolkata, West Bengal, 700091",
        weight: 2,
        express: true
    },
    {
        name: "Case 3: Intra-State (Same State) - Mumbai to Pune",
        sender: "Flat 202, Borivali, Mumbai, Maharashtra, 400066",
        receiver: "Office 5, Hinjewadi, Pune, Maharashtra, 411057",
        weight: 5,
        express: false
    },
    {
        name: "Case 4: Intra-State (Local) - Delhi",
        sender: "House 12, Karol Bagh, Delhi, Delhi, 110005",
        receiver: "House 99, Karol Bagh, Delhi, Delhi, 110005",
        weight: 1,
        express: true
    },
    {
        name: "Case 5: Unsupported Route",
        sender: "Street 1, Shimla, Himachal Pradesh, 171001",
        receiver: "Street 2, Itanagar, Arunachal Pradesh, 791111",
        weight: 2,
        express: false
    }
];

console.log("==================================================");
console.log("         DELIVERY ESTIMATOR TEST REPORT           ");
console.log("==================================================\n");

testCases.forEach((tc, index) => {
    console.log(`TEST #${index + 1}: ${tc.name}`);
    const result = getEstimation(tc.sender, tc.receiver, tc.weight, tc.express);
    
    if (result.status === "Success") {
        console.log(`  > Distance: ${result.details.distance}`);
        console.log(`  > Cost:     ${result.details.totalCost}`);
        console.log(`  > Time:     ${result.details.deliveryTime} (${result.details.mode})`);
    } else {
        console.log(`  > FAILED:   ${result.message}`);
    }
    console.log("--------------------------------------------------");
});