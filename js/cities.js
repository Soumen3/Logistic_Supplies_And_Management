const cityCoordinates = {
  // === METRO CITIES ===
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "bengaluru": { lat: 12.9716, lon: 77.5946 },
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  "kolkata": { lat: 22.5726, lon: 88.3639 },
  "pune": { lat: 18.5204, lon: 73.8567 },
  "ahmedabad": { lat: 23.0225, lon: 72.5714 },
  "surat": { lat: 21.1702, lon: 72.8311 },

  // === RAJASTHAN ===
  "jaipur": { lat: 26.9124, lon: 75.7873 },
  "jodhpur": { lat: 26.2389, lon: 73.0243 },
  "udaipur": { lat: 24.5854, lon: 73.7125 },
  "kota": { lat: 25.2138, lon: 75.8648 },
  "bikaner": { lat: 28.0229, lon: 73.3119 },
  "ajmer": { lat: 26.4499, lon: 74.6399 },
  "alwar": { lat: 27.5530, lon: 76.6346 },
  "bharatpur": { lat: 27.2152, lon: 77.4897 },
  "sikar": { lat: 27.6094, lon: 75.1399 },
  "pali": { lat: 25.7711, lon: 73.3234 },

  // === UTTAR PRADESH ===
  "lucknow": { lat: 26.8467, lon: 80.9462 },
  "kanpur": { lat: 26.4499, lon: 80.3319 },
  "agra": { lat: 27.1767, lon: 78.0081 },
  "varanasi": { lat: 25.3176, lon: 82.9739 },
  "allahabad": { lat: 25.4358, lon: 81.8463 },
  "prayagraj": { lat: 25.4358, lon: 81.8463 },
  "meerut": { lat: 28.9845, lon: 77.7064 },
  "noida": { lat: 28.5355, lon: 77.3910 },
  "ghaziabad": { lat: 28.6692, lon: 77.4538 },
  "bareilly": { lat: 28.3470, lon: 79.4304 },
  "aligarh": { lat: 27.8974, lon: 78.0880 },
  "moradabad": { lat: 28.8386, lon: 78.7733 },
  "gorakhpur": { lat: 26.7606, lon: 83.3732 },
  "mathura": { lat: 27.4924, lon: 77.6737 },
  "vrindavan": { lat: 27.5794, lon: 77.6964 },

  // === MAHARASHTRA ===
  "nashik": { lat: 19.9975, lon: 73.7898 },
  "nagpur": { lat: 21.1458, lon: 79.0882 },
  "aurangabad": { lat: 19.8762, lon: 75.3433 },
  "solapur": { lat: 17.6599, lon: 75.9064 },
  "kolhapur": { lat: 16.7050, lon: 74.2433 },
  "thane": { lat: 19.2183, lon: 72.9781 },
  "navi mumbai": { lat: 19.0330, lon: 73.0297 },
  "amravati": { lat: 20.9374, lon: 77.7796 },
  "latur": { lat: 18.4088, lon: 76.5604 },
  "jalgaon": { lat: 21.0077, lon: 75.5626 },

  // === GUJARAT ===
  "vadodara": { lat: 22.3072, lon: 73.1812 },
  "rajkot": { lat: 22.3039, lon: 70.8022 },
  "bhavnagar": { lat: 21.7645, lon: 72.1519 },
  "jamnagar": { lat: 22.4707, lon: 70.0577 },
  "gandhinagar": { lat: 23.2156, lon: 72.6369 },
  "anand": { lat: 22.5645, lon: 72.9289 },
  "morbi": { lat: 22.8173, lon: 70.8377 },
  "junagadh": { lat: 21.5222, lon: 70.4579 },

  // === KARNATAKA ===
  "mysuru": { lat: 12.2958, lon: 76.6394 },
  "mysore": { lat: 12.2958, lon: 76.6394 },
  "mangaluru": { lat: 12.9141, lon: 74.8560 },
  "mangalore": { lat: 12.9141, lon: 74.8560 },
  "hubli": { lat: 15.3647, lon: 75.1240 },
  "dharwad": { lat: 15.4589, lon: 75.0078 },
  "belagavi": { lat: 15.8497, lon: 74.4977 },
  "belgaum": { lat: 15.8497, lon: 74.4977 },
  "davanagere": { lat: 14.4644, lon: 75.9218 },
  "bellary": { lat: 15.1394, lon: 76.9214 },
  "gulbarga": { lat: 17.3297, lon: 76.8343 },
  "shimoga": { lat: 13.9299, lon: 75.5681 },
  "tumkur": { lat: 13.3379, lon: 77.1173 },
  "udupi": { lat: 13.3409, lon: 74.7421 },

  // === TAMIL NADU ===
  "coimbatore": { lat: 11.0168, lon: 76.9558 },
  "madurai": { lat: 9.9252, lon: 78.1198 },
  "tiruchirappalli": { lat: 10.7905, lon: 78.7047 },
  "trichy": { lat: 10.7905, lon: 78.7047 },
  "salem": { lat: 11.6643, lon: 78.1460 },
  "tirunelveli": { lat: 8.7139, lon: 77.7567 },
  "vellore": { lat: 12.9165, lon: 79.1325 },
  "erode": { lat: 11.3410, lon: 77.7172 },
  "thanjavur": { lat: 10.7870, lon: 79.1378 },
  "dindigul": { lat: 10.3673, lon: 77.9803 },
  "tiruppur": { lat: 11.1085, lon: 77.3411 },
  "kancheepuram": { lat: 12.8185, lon: 79.6947 },

  // === TELANGANA ===
  "warangal": { lat: 17.9689, lon: 79.5941 },
  "nizamabad": { lat: 18.6725, lon: 78.0941 },
  "karimnagar": { lat: 18.4386, lon: 79.1288 },
  "khammam": { lat: 17.2473, lon: 80.1514 },

  // === ANDHRA PRADESH ===
  "visakhapatnam": { lat: 17.6868, lon: 83.2185 },
  "vizag": { lat: 17.6868, lon: 83.2185 },
  "vijayawada": { lat: 16.5062, lon: 80.6480 },
  "guntur": { lat: 16.3067, lon: 80.4365 },
  "tirupati": { lat: 13.6288, lon: 79.4192 },
  "nellore": { lat: 14.4426, lon: 79.9865 },
  "kurnool": { lat: 15.8281, lon: 78.0373 },
  "rajahmundry": { lat: 17.0005, lon: 81.8040 },

  // === KERALA ===
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "trivandrum": { lat: 8.5241, lon: 76.9366 },
  "kochi": { lat: 9.9312, lon: 76.2673 },
  "cochin": { lat: 9.9312, lon: 76.2673 },
  "kozhikode": { lat: 11.2588, lon: 75.7804 },
  "calicut": { lat: 11.2588, lon: 75.7804 },
  "thrissur": { lat: 10.5276, lon: 76.2144 },
  "kollam": { lat: 8.8932, lon: 76.6141 },
  "kannur": { lat: 11.8745, lon: 75.3704 },
  "palakkad": { lat: 10.7867, lon: 76.6548 },
  "malappuram": { lat: 11.0510, lon: 76.0711 },
  "kottayam": { lat: 9.5916, lon: 76.5222 },

  // === WEST BENGAL ===
  "howrah": { lat: 22.5958, lon: 88.2636 },
  "durgapur": { lat: 23.5204, lon: 87.3119 },
  "asansol": { lat: 23.6739, lon: 86.9524 },
  "siliguri": { lat: 26.7271, lon: 88.3953 },
  "darjeeling": { lat: 27.0360, lon: 88.2627 },
  "kharagpur": { lat: 22.3302, lon: 87.3237 },
  "bardhaman": { lat: 23.2324, lon: 87.8615 },
  "burdwan": { lat: 23.2324, lon: 87.8615 },
  "malda": { lat: 25.0108, lon: 88.1411 },
  "jalpaiguri": { lat: 26.5165, lon: 88.7180 },
  "haldia": { lat: 22.0667, lon: 88.0698 },
  "kalyani": { lat: 22.9751, lon: 88.4345 },
  "baharampur": { lat: 24.1010, lon: 88.2520 },
  "medinipur": { lat: 22.4257, lon: 87.3199 },
  "midnapore": { lat: 22.4257, lon: 87.3199 },
  "purulia": { lat: 23.3321, lon: 86.3616 },
  "krishnanagar": { lat: 23.4013, lon: 88.4988 },
  "bankura": { lat: 23.2313, lon: 87.0784 },

  // === PUNJAB & HARYANA ===
  "chandigarh": { lat: 30.7333, lon: 76.7794 },
  "ludhiana": { lat: 30.9010, lon: 75.8573 },
  "amritsar": { lat: 31.6340, lon: 74.8723 },
  "jalandhar": { lat: 31.3260, lon: 75.5762 },
  "patiala": { lat: 30.3398, lon: 76.3869 },
  "faridabad": { lat: 28.4089, lon: 77.3178 },
  "gurugram": { lat: 28.4595, lon: 77.0266 },
  "gurgaon": { lat: 28.4595, lon: 77.0266 },
  "rohtak": { lat: 28.8955, lon: 76.6066 },
  "hisar": { lat: 29.1492, lon: 75.7217 },
  "ambala": { lat: 30.3752, lon: 76.7821 },
  "panipat": { lat: 29.3909, lon: 76.9635 },
  "karnal": { lat: 29.6857, lon: 76.9905 },

  // === MADHYA PRADESH ===
  "bhopal": { lat: 23.2599, lon: 77.4126 },
  "indore": { lat: 22.7196, lon: 75.8577 },
  "jabalpur": { lat: 23.1815, lon: 79.9864 },
  "gwalior": { lat: 26.2183, lon: 78.1828 },
  "ujjain": { lat: 23.1765, lon: 75.7885 },
  "sagar": { lat: 23.8388, lon: 78.7378 },
  "rewa": { lat: 24.5362, lon: 81.2996 },
  "satna": { lat: 24.6005, lon: 80.8322 },

  // === BIHAR & JHARKHAND ===
  "patna": { lat: 25.5941, lon: 85.1376 },
  "gaya": { lat: 24.7955, lon: 85.0002 },
  "muzaffarpur": { lat: 26.1209, lon: 85.3647 },
  "bhagalpur": { lat: 25.2425, lon: 86.9842 },
  "ranchi": { lat: 23.3441, lon: 85.3096 },
  "jamshedpur": { lat: 22.8046, lon: 86.2029 },
  "dhanbad": { lat: 23.7957, lon: 86.4304 },
  "bokaro": { lat: 23.6693, lon: 86.1511 },

  // === ODISHA ===
  "bhubaneswar": { lat: 20.2961, lon: 85.8245 },
  "cuttack": { lat: 20.4625, lon: 85.8830 },
  "rourkela": { lat: 22.2604, lon: 84.8536 },
  "puri": { lat: 19.8135, lon: 85.8312 },

  // === NORTHEAST ===
  "guwahati": { lat: 26.1445, lon: 91.7362 },
  "dibrugarh": { lat: 27.4728, lon: 94.9120 },
  "silchar": { lat: 24.8333, lon: 92.7789 },
  "imphal": { lat: 24.8170, lon: 93.9368 },
  "shillong": { lat: 25.5788, lon: 91.8933 },
  "agartala": { lat: 23.8315, lon: 91.2868 },
  "aizawl": { lat: 23.7271, lon: 92.7176 },
  "itanagar": { lat: 27.0844, lon: 93.6053 },

  // === HIMACHAL & UTTARAKHAND ===
  "shimla": { lat: 31.1048, lon: 77.1734 },
  "manali": { lat: 32.2396, lon: 77.1887 },
  "dharamsala": { lat: 32.2190, lon: 76.3234 },
  "dehradun": { lat: 30.3165, lon: 78.0322 },
  "haridwar": { lat: 29.9457, lon: 78.1642 },
  "rishikesh": { lat: 30.0869, lon: 78.2676 },
  "nainital": { lat: 29.3803, lon: 79.4636 },
  "mussoorie": { lat: 30.4598, lon: 78.0664 },

  // === GOA ===
  "panaji": { lat: 15.4909, lon: 73.8278 },
  "margao": { lat: 15.2832, lon: 73.9862 },
  "vasco da gama": { lat: 15.3982, lon: 73.8113 },

  // === J&K ===
  "srinagar": { lat: 34.0837, lon: 74.7973 },
  "jammu": { lat: 32.7266, lon: 74.8570 },
  "leh": { lat: 34.1526, lon: 77.5771 },

  // === CHHATTISGARH ===
  "raipur": { lat: 21.2514, lon: 81.6296 },
  "bhilai": { lat: 21.1938, lon: 81.3509 },
  "bilaspur": { lat: 22.0796, lon: 82.1391 },
  "korba": { lat: 22.3595, lon: 82.7501 },

  // === UTTARAKHAND ===
  "dehradun": { lat: 30.3165, lon: 78.0322 },
  "haridwar": { lat: 29.9457, lon: 78.1642 },
  "rishikesh": { lat: 30.0869, lon: 78.2676 },
  "nainital": { lat: 29.3803, lon: 79.4636 },
  "mussoorie": { lat: 30.4598, lon: 78.0664 },
  "almora": { lat: 29.6167, lon: 79.6506 },
  "pithoragarh": { lat: 29.7219, lon: 80.2304 },
  "kashipur": { lat: 29.2091, lon: 79.0028 },
  "roorkee": { lat: 29.8543, lon: 77.8961 },

  // === PUNJAB ===
  "chandigarh": { lat: 30.7333, lon: 76.7794 },
  "ludhiana": { lat: 30.9010, lon: 75.8573 },
  "amritsar": { lat: 31.6340, lon: 74.8723 },
  "jalandhar": { lat: 31.3260, lon: 75.5762 },
  "patiala": { lat: 30.3398, lon: 76.3869 },
  "bathinda": { lat: 30.2126, lon: 75.0742 },
  "firozpur": { lat: 30.9710, lon: 74.6324 },
  "hoshiarpur": { lat: 31.5204, lon: 75.9243 },
  "barnala": { lat: 30.0086, lon: 75.5310 },
  "sangrur": { lat: 30.2107, lon: 75.8467 },
  "pathankot": { lat: 32.2525, lon: 75.6499 },
  "moga": { lat: 30.8319, lon: 75.1607 },
  "fatehgarh sahib": { lat: 30.6056, lon: 76.4762 },

  // === ODISHA (added missing cities) ===
  "bhubaneswar": { lat: 20.2961, lon: 85.8245 },
  "cuttack": { lat: 20.4625, lon: 85.8830 },
  "rourkela": { lat: 22.2604, lon: 84.8536 },
  "puri": { lat: 19.8135, lon: 85.8312 },
  "balasore": { lat: 21.5000, lon: 86.9333 },
  "berhampur": { lat: 19.3033, lon: 84.8062 },
  "sambalpur": { lat: 21.4724, lon: 83.9889 },
  "baripada": { lat: 21.9456, lon: 86.7374 },
  "bhawanipatna": { lat: 19.9937, lon: 83.1522 },
  "jajpur road": { lat: 20.8465, lon: 86.3312 },

  // === HARYANA ===
  "gurugram": { lat: 28.4595, lon: 77.0266 },
  "gurgaon": { lat: 28.4595, lon: 77.0266 },
  "faridabad": { lat: 28.4089, lon: 77.3178 },
  "panipat": { lat: 29.3909, lon: 76.9635 },
  "karnal": { lat: 29.6857, lon: 76.9905 },
  "rohtak": { lat: 28.8955, lon: 76.6066 },
  "hisar": { lat: 29.1492, lon: 75.7217 },
  "ambala": { lat: 30.3752, lon: 76.7821 },
  "bhiwani": { lat: 28.7041, lon: 76.1300 },
  "sonipat": { lat: 28.9732, lon: 77.0092 },
  "jhajjar": { lat: 28.6160, lon: 76.6100 },
  "palwal": { lat: 28.1650, lon: 77.2930 },
  "narnaul": { lat: 28.0353, lon: 76.1047 },
  "sirsa": { lat: 29.5276, lon: 75.0331 },
  "bahadurgarh": { lat: 28.6600, lon: 76.9100 },
  "pinjore": { lat: 30.8100, lon: 76.9500 },

  // ===Himachal Pradesh===
  "shimla": { lat: 31.1048, lon: 77.1734 },
  "manali": { lat: 32.2396, lon: 77.1887 },
  "dharamsala": { lat: 32.2190, lon: 76.3234 },
  "mandi": { lat: 31.7304, lon: 77.1928 },
  "solan": { lat: 31.1049, lon: 77.1088 },
  "nahan": { lat: 30.5480, lon: 77.2934 },
  "kullu": { lat: 31.7833, lon: 77.1167 },
  "hamirpur": { lat: 31.6900, lon: 76.5300 },
  "kangra": { lat: 32.0900, lon: 76.2600 },
  "bilaspur": { lat: 31.7020, lon: 76.7346 }
};

export const getCityCoords = (cityName) => {
  const key = cityName.toLowerCase().trim();
  const coords = cityCoordinates[key];
  if (!coords) {
    throw new Error(`City "${cityName}" not found. Please check spelling.`);
  }
  return coords;
};