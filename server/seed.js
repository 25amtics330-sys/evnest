require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Charger = require('./models/Charger');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evnest';

const chargersData = [
  {
    title: "Rajesh's Driveway 7.4kW Plug",
    description: "Located in my secure residential driveway in Adajan. Ideal for fast/overnight charging. Friendly host, tea/coffee provided if I'm home!",
    address: 'Adajan Road, Surat, Gujarat 395009',
    lat: 21.1855,
    lng: 72.7989,
    connectorType: 'Type2',
    speedKw: 7.4,
    baseElectricityCost: 7.0,
    markupPercent: 20,
    hostEmail: 'merchant@evnest.com'
  },
  {
    title: "Sneha's Society Garage Socket",
    description: "Safe, covered parking space inside Gokul Row House. Gated community with 24/7 security guard. Please ring bell at House No. 12.",
    address: 'Vesu Canal Road, Vesu, Surat, Gujarat 395007',
    lat: 21.1350,
    lng: 72.7730,
    connectorType: 'Bharat AC',
    speedKw: 3.3,
    baseElectricityCost: 7.5,
    markupPercent: 20,
    hostEmail: 'sneha@evnest.com'
  },
  {
    title: "Mehta Villa Type 2 Fast Charger",
    description: "High-speed 11kW Type 2 charger installed at my bungalow driveway. Access from the main road. Fully automated via plug & charge.",
    address: 'Gaurav Path, Piplod, Surat, Gujarat 395007',
    lat: 21.1592,
    lng: 72.7745,
    connectorType: 'Type2',
    speedKw: 11.0,
    baseElectricityCost: 8.0,
    markupPercent: 30,
    hostEmail: 'vikram@evnest.com'
  },
  {
    title: "Amit's Apartment Parking Slot #4",
    description: "A fast 7.4kW Type 2 charger located in my apartment parking. Lift barrier is automated, I will share the access code upon booking approval.",
    address: 'Pal-Bhatha Road, Pal, Surat, Gujarat 395009',
    lat: 21.1960,
    lng: 72.7780,
    connectorType: 'Type2',
    speedKw: 7.4,
    baseElectricityCost: 7.8,
    markupPercent: 25,
    hostEmail: 'amit@evnest.com'
  },
  {
    title: "Patel House Gate 15A plug",
    description: "Easy access 15A socket just outside our compound wall. Ideal for 2-wheelers or slow EV car charging. Open 24/7.",
    address: 'Rander Road, Rander, Surat, Gujarat 395005',
    lat: 21.2165,
    lng: 72.7950,
    connectorType: 'Bharat AC',
    speedKw: 3.3,
    baseElectricityCost: 6.8,
    markupPercent: 10,
    hostEmail: 'merchant@evnest.com'
  },
  {
    title: "Hardik's Garage Wallbox",
    description: "My personal 7.4kW charger in Katargam. Covered parking, CCTV monitored. Please message in advance to open the garage shutter.",
    address: 'Katargam Main Road, Katargam, Surat, Gujarat 395004',
    lat: 21.2290,
    lng: 72.8250,
    connectorType: 'Type2',
    speedKw: 7.4,
    baseElectricityCost: 8.2,
    markupPercent: 20,
    hostEmail: 'hardik@evnest.com'
  },
  {
    title: "Priya's Gated Society Plug",
    description: "7.4kW Type 2 charger inside a premium high-rise society in Bhatar. Gated entry, security will verify your booking ID. Visitors parking slot 12.",
    address: 'Bhatar Road, Bhatar, Surat, Gujarat 395017',
    lat: 21.1620,
    lng: 72.8120,
    connectorType: 'Type2',
    speedKw: 7.4,
    baseElectricityCost: 8.0,
    markupPercent: 25,
    hostEmail: 'priya@evnest.com'
  },
  {
    title: "Sanjay's 22kW Semi-Public Charger",
    description: "High capacity 22kW AC charger in front of my grocery store. Charge while you shop or grab snacks next door. Friendly neighborhood.",
    address: 'Varachha Main Road, Varachha, Surat, Gujarat 395006',
    lat: 21.2110,
    lng: 72.8580,
    connectorType: 'Type2',
    speedKw: 22.0,
    baseElectricityCost: 9.0,
    markupPercent: 30,
    hostEmail: 'sanjay@evnest.com'
  },
  {
    title: "Anjali's Apartment Lobby Plug",
    description: "Standard 16A socket located near the apartment lift lobby. Please bring your own portable charging cable. Society guards are informed.",
    address: 'City Light Town, Surat, Gujarat 395007',
    lat: 21.1540,
    lng: 72.8010,
    connectorType: 'Bharat AC',
    speedKw: 3.3,
    baseElectricityCost: 7.2,
    markupPercent: 15,
    hostEmail: 'anjali@evnest.com'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to Database for seeding...');

    // 1. Clear database Collections
    await Charger.deleteMany({});
    await User.deleteMany({ 
      email: { 
        $in: [
          'merchant@evnest.com', 
          'sneha@evnest.com', 
          'vikram@evnest.com', 
          'amit@evnest.com', 
          'hardik@evnest.com', 
          'priya@evnest.com', 
          'sanjay@evnest.com', 
          'anjali@evnest.com', 
          'driver@evnest.com'
        ] 
      } 
    });
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data.');

    // 2. Create seed Merchant and Driver users
    const merchantsData = [
      { name: 'Rajesh Sharma', email: 'merchant@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Sneha Patel', email: 'sneha@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Vikram Mehta', email: 'vikram@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Amit Ghelani', email: 'amit@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Hardik Gajjar', email: 'hardik@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Priya Shah', email: 'priya@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Sanjay Kumar', email: 'sanjay@evnest.com', password: 'password123', role: 'merchant' },
      { name: 'Anjali Desai', email: 'anjali@evnest.com', password: 'password123', role: 'merchant' }
    ];

    const seededMerchants = [];
    for (const mData of merchantsData) {
      const u = new User(mData);
      await u.save();
      seededMerchants.push(u);
    }

    const driver = new User({
      name: 'Amit Patel',
      email: 'driver@evnest.com',
      password: 'password123', // Will be hashed via pre-save hook
      role: 'user',
      carModel: 'Tata Nexon EV Max',
      batteryCapacityKwh: 40.5,
    });
    await driver.save();

    console.log('Seed users created:');
    console.log(`- Driver: driver@evnest.com (password123)`);
    console.log(`- Loaded ${seededMerchants.length} P2P hosts:`);
    seededMerchants.forEach(m => console.log(`  * Host: ${m.name} (${m.email})`));

    // 3. Create Chargers populated with Merchant ID
    const photosList = [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1619641774843-be68de3b0185?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=600&q=80'
    ];

    const gujaratCities = [
      // Major Cities
      { name: 'Surat', lat: 21.1702, lng: 72.8311, size: 'large', areas: ['Adajan', 'Vesu', 'Piplod', 'Pal', 'Katargam', 'Bhatar', 'Varachha', 'City Light', 'Rander', 'Udhna'] },
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, size: 'large', areas: ['Satellite', 'Bodakdev', 'Vastrapur', 'Maninagar', 'Navrangpura', 'Prahlad Nagar', 'Ghatlodia', 'Ranip', 'Chandkheda', 'Jodhpur'] },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812, size: 'large', areas: ['Alkapuri', 'Gotri', 'Akota', 'Manjalpur', 'Sayajiganj', 'Fatehgunj', 'Karelibaug'] },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022, size: 'large', areas: ['Kalawad Road', 'Yagnik Road', 'Mavdi', 'Gandhigram', 'Kuvadva Road', 'Bhaktinagar'] },

      // Medium Cities
      { name: 'Gandhinagar', lat: 23.2156, lng: 72.6369, size: 'medium', areas: ['Sector 21', 'Sector 11', 'Sector 6', 'Sargasan', 'Kudasan', 'Infocity'] },
      { name: 'Anand', lat: 22.5645, lng: 72.9289, size: 'medium', areas: ['Vallabh Vidyanagar', 'Karamsad', 'Chikhodra', 'Hadgud'] },
      { name: 'Nadiad', lat: 22.6916, lng: 72.8634, size: 'medium', areas: ['College Road', 'Santram Mandir Road', 'Mill Road'] },
      { name: 'Bharuch', lat: 21.7051, lng: 72.9959, size: 'medium', areas: ['GNFC Township', 'Bholav', 'Zadeshwar', 'Sherpura'] },
      { name: 'Ankleshwar', lat: 21.6264, lng: 73.0152, size: 'medium', areas: ['GIDC', 'Jada Road', 'Valia Road'] },
      { name: 'Vapi', lat: 20.3718, lng: 72.9090, size: 'medium', areas: ['Chala', 'Imran Nagar', 'GIDC Housing', 'Chanod'] },
      { name: 'Valsad', lat: 20.5993, lng: 72.9342, size: 'medium', areas: ['Dharampur Road', 'Tithal Road', 'Kalyan Baug'] },
      { name: 'Navsari', lat: 20.9467, lng: 72.9520, size: 'medium', areas: ['Kaliawadi', 'Lunsikui', 'Vijalpore', 'Amba Talav'] },
      { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519, size: 'medium', areas: ['Kalanala', 'Sardar Nagar', 'Takhteshwar', 'Talaja Road'] },
      { name: 'Jamnagar', lat: 22.4707, lng: 70.0577, size: 'medium', areas: ['Digvijay Plot', 'Patel Colony', 'Khodiyar Colony', 'Windmill Area'] },
      { name: 'Bhuj', lat: 23.2420, lng: 69.6670, size: 'medium', areas: ['Madhapar', 'Mirzapar', 'Camp Area', 'Jubilee Colony'] },
      { name: 'Junagadh', lat: 21.5222, lng: 70.4579, size: 'medium', areas: ['Zanzarda Road', 'Moti Baug', 'Kalwa Chowk'] },
      { name: 'Morbi', lat: 22.8120, lng: 70.8235, size: 'medium', areas: ['Sanala Road', 'Ravapar Road', 'GIDC'] },
      { name: 'Surendranagar', lat: 22.7262, lng: 71.6380, size: 'medium', areas: ['Bus Stand Road', 'GIDC', 'Wadhwan'] },
      { name: 'Mehsana', lat: 23.6010, lng: 72.3997, size: 'medium', areas: ['Radhanpur Road', 'Modhera Road', 'Highway Area'] },
      { name: 'Palanpur', lat: 24.1722, lng: 72.4340, size: 'medium', areas: ['Abu Road', 'Gathaman Gate', 'Deesa Highway'] },
      { name: 'Gandhidham', lat: 23.0763, lng: 70.1337, size: 'medium', areas: ['Sector 12', 'Sector 5', 'GIDC'] },

      // Small Towns / Highway Transit Nodes
      { name: 'Limbdi', lat: 22.5641, lng: 71.8080, size: 'small', areas: ['Highway Plaza', 'Station Road'] },
      { name: 'Chotila', lat: 22.4278, lng: 71.3033, size: 'small', areas: ['Temple Road', 'NH-47 Bypass'] },
      { name: 'Dholera', lat: 22.2530, lng: 72.1930, size: 'small', areas: ['SIR Region', 'Expressway Junction'] },
      { name: 'Dhandhuka', lat: 22.3683, lng: 71.9836, size: 'small', areas: ['College Road', 'Bypass Road'] },
      { name: 'Jetpur', lat: 21.7615, lng: 70.6276, size: 'small', areas: ['Navagadh', 'Gondal Road'] },
      { name: 'Veraval', lat: 20.9015, lng: 70.4005, size: 'small', areas: ['Somnath Bypass', 'Prabhas Patan'] },
      { name: 'Porbandar', lat: 21.6417, lng: 69.6093, size: 'small', areas: ['Chhaya', 'Birla Road'] },
      { name: 'Dwarka', lat: 22.2442, lng: 68.9684, size: 'small', areas: ['Sunset Point Road', 'Okha Highway'] },
      { name: 'Radhanpur', lat: 23.8318, lng: 71.6050, size: 'small', areas: ['Varahi Road', 'Chanasma Highway'] },
      { name: 'Deesa', lat: 24.2580, lng: 72.1915, size: 'small', areas: ['Palanpur Road', 'Airfield Road'] },
      { name: 'Himatnagar', lat: 23.5979, lng: 72.9623, size: 'small', areas: ['Motipura', 'Mahavirnagar'] },
      { name: 'Modasa', lat: 23.4682, lng: 73.3001, size: 'small', areas: ['Malpur Road', 'Shamlaji Road'] },
      { name: 'Godhra', lat: 22.7766, lng: 73.6149, size: 'small', areas: ['Vavadi Buzarg', 'Dahod Road'] },
      { name: 'Halol', lat: 22.5029, lng: 73.4651, size: 'small', areas: ['GIDC Industrial', 'Pavagadh Bypass'] },
      { name: 'Vyara', lat: 21.1212, lng: 73.4011, size: 'small', areas: ['Station Road', 'Songadh Bypass'] },
      { name: 'Bardoli', lat: 21.1215, lng: 73.1130, size: 'small', areas: ['Sardar Patel Road', 'Dhulia Highway'] },
      { name: 'Saputara', lat: 20.7321, lng: 73.7486, size: 'small', areas: ['Hill Station Lake Road', 'Nasik Road'] },
      { name: 'Dharampur', lat: 20.5404, lng: 73.1818, size: 'small', areas: ['State Highway 15', 'Valsad Road'] },
      { name: 'Chikhli', lat: 20.7589, lng: 73.0645, size: 'small', areas: ['College Road', 'Bilimora Road'] },
      { name: 'Anjar', lat: 23.1134, lng: 70.0275, size: 'small', areas: ['Ganga Naka', 'Galpadar Road'] },
      { name: 'Mundra', lat: 22.8395, lng: 69.7249, size: 'small', areas: ['Port Road', 'Pratappar'] },
      { name: 'Mandvi', lat: 22.8340, lng: 69.3551, size: 'small', areas: ['Salaya', 'Koday Road'] },
      { name: 'Patan', lat: 23.8493, lng: 72.1257, size: 'small', areas: ['University Road', 'Chanasma Road'] },
      { name: 'Dahod', lat: 22.8376, lng: 74.2570, size: 'small', areas: ['Godi Road', 'Indore Highway'] }
    ];

    const firstNames = ['Arjun', 'Vijay', 'Rahul', 'Nikhil', 'Karan', 'Deepak', 'Sanjay', 'Manish', 'Rakesh', 'Aarav', 'Dev', 'Kabir', 'Rohan', 'Pranav', 'Nehal', 'Jatin', 'Kunal', 'Harsh', 'Tushar', 'Yash', 'Meera', 'Riya', 'Kiran', 'Nisha', 'Aisha'];
    const lastNames = ['Patel', 'Shah', 'Mehta', 'Sharma', 'Joshi', 'Gajiwala', 'Vyas', 'Trivedi', 'Dave', 'Chaudhary', 'Gohil', 'Jadeja', 'Solanki', 'Parmar', 'Rana', 'Pandya', 'Mistry', 'Kapoor', 'Sanghvi', 'Desai'];

    const speedKwOptions = [3.3, 7.4, 11.0, 22.0, 50.0];

    const extraChargers = [];
    for (let i = 10; i <= 1210; i++) {
      const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
      const speedKw = speedKwOptions[Math.floor(Math.random() * speedKwOptions.length)];
      
      let connectorType = 'Type2';
      if (speedKw <= 3.3) connectorType = 'Bharat AC';
      else if (speedKw >= 50.0) connectorType = 'CCS';
      else connectorType = Math.random() > 0.45 ? 'Type2' : 'Bharat AC';

      const baseCost = parseFloat((6.8 + Math.random() * 3.5).toFixed(1));
      const markup = Math.random() > 0.6 ? 20 : (Math.random() > 0.4 ? 25 : 30);
      const hostUser = seededMerchants[i % seededMerchants.length];

      // Select location and generate coordinates using radial polar coordinates
      const location = gujaratCities[Math.floor(Math.random() * gujaratCities.length)];
      const area = location.areas[Math.floor(Math.random() * location.areas.length)];

      let maxRadius = 0.04;
      if (location.size === 'large') {
        maxRadius = 0.15;
      } else if (location.size === 'medium') {
        maxRadius = 0.08;
      }

      const r = Math.pow(Math.random(), 1.5) * maxRadius;
      const theta = Math.random() * 2 * Math.PI;
      const lat = parseFloat((location.lat + r * Math.sin(theta)).toFixed(6));
      const lng = parseFloat((location.lng + r * Math.cos(theta)).toFixed(6));

      const isHighwayStop = location.size === 'small' || Math.random() > 0.6;
      let title, address, description;

      if (isHighwayStop) {
        const stops = ['Dhaba', 'Food Court', 'Motel', 'Hotel', 'Petrol Pump', 'Rest Stop', 'Chai Tapri'];
        const stopType = stops[Math.floor(Math.random() * stops.length)];
        title = `${name.split(' ')[0]}'s Highway ${stopType} Nest`;
        address = `${area}, Near highway, ${location.name}, Gujarat`;
        description = `Convenient highway charger located at a ${stopType} near ${location.name}. Managed by host ${name}. Washrooms and dining options available nearby.`;
      } else {
        title = `${name.split(' ')[0]}'s Home EV Nest (${speedKw}kW)`;
        address = `${area}, ${location.name}, Gujarat, India`;
        description = `A secure residential home charging socket located in ${area}, ${location.name}. Hosted by ${name}. Safe street parking, tea/coffee/Wi-Fi offered by the host if available.`;
      }

      extraChargers.push({
        title: title,
        description: description,
        address: address,
        lat: lat,
        lng: lng,
        connectorType: connectorType,
        speedKw: speedKw,
        baseElectricityCost: baseCost,
        markupPercent: markup,
        hostEmail: hostUser.email
      });
    }

    chargersData.push(...extraChargers);

    for (let i = 0; i < chargersData.length; i++) {
      const data = chargersData[i];
      const hostUser = seededMerchants.find(m => m.email === data.hostEmail) || seededMerchants[0];
      const calculatedPrice = data.baseElectricityCost * (1 + data.markupPercent / 100);

      const { hostEmail, ...chargerModelData } = data;

      const charger = new Charger({
        ...chargerModelData,
        merchantId: hostUser._id,
        pricePerKwh: parseFloat(calculatedPrice.toFixed(2)),
        photos: [photosList[i % photosList.length]],
        isLive: true,
      });

      await charger.save();

      // Seed reviews only for the first 20 chargers to keep database writes fast
      if (i < 20) {
        const reviewText1 = i % 3 === 0 
          ? `Excellent charger! Fast speeds and very convenient location. ${hostUser.name.split(' ')[0]} was highly supportive.`
          : i % 3 === 1
            ? `Quiet and safe residential society. Easy overnight charging slot. Recommended!`
            : `Top quality speed, highly automated plug & charge setup. Very polite host.`;

        const review1 = new Review({
          userId: driver._id,
          chargerId: charger._id,
          rating: 5,
          comment: reviewText1,
        });
        await review1.save();
        
        const review2 = new Review({
          userId: driver._id,
          chargerId: charger._id,
          rating: 4,
          comment: `Charged Nexon EV without issues. Secure parking slot.`,
        });
        await review2.save();
      }
    }

    console.log(`Seeded ${chargersData.length} P2P residential chargers successfully!`);
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
