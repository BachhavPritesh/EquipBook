// Demo data copied from the frontend fixtures so the API and UI match.
// Fixed IDs keep local demo references stable across seed runs.
export const demoCategories = [
  {
    _id: "cat-av",
    name: "Audio & Visual",
    description:
      "Cameras, microphones, and recording equipment for interviews, podcasts, and events.",
  },
  {
    _id: "cat-computing",
    name: "Computing & Devices",
    description:
      "Laptops, tablets, and specialist computing hardware available for short-term loan.",
  },
  {
    _id: "cat-presentation",
    name: "Presentation & Events",
    description:
      "Projectors, screens, and portable audio systems for lectures and campus events.",
  },
  {
    _id: "cat-media",
    name: "Media Production",
    description:
      "Drone, lighting, and stabilisation equipment for film and photography shoots.",
  },
  {
    _id: "cat-research",
    name: "Research & Lab",
    description:
      "Precision instruments and fabrication tools for laboratory and field research.",
  },
];

// Passwords are added by seed.js so they are hashed by the User model.
export const demoUsers = [
  {
    _id: "000000000000000000000001",
    name: "Aarav Mehta",
    email: "aarav.mehta@northbridge.edu",
    role: "student",
    department: "Computer Science",
    phone: "+1 (415) 555-0142",
  },
  {
    _id: "000000000000000000000002",
    name: "Priya Nair",
    email: "priya.nair@northbridge.edu",
    role: "manager",
    department: "Resource Operations",
    phone: "+1 (415) 555-0188",
  },
  {
    _id: "000000000000000000000003",
    name: "Maya Chen",
    email: "maya.chen@northbridge.edu",
    role: "faculty",
    department: "Design",
    phone: "+1 (415) 555-0121",
  },
  {
    _id: "000000000000000000000004",
    name: "Daniel Okafor",
    email: "daniel.okafor@northbridge.edu",
    role: "employee",
    department: "Events & Hospitality",
    phone: "+1 (415) 555-0177",
  },
  {
    _id: "000000000000000000000005",
    name: "Sofia Ramirez",
    email: "sofia.ramirez@northbridge.edu",
    role: "student",
    department: "Media Studies",
    phone: "+1 (415) 555-0119",
  },
  {
    _id: "000000000000000000000006",
    name: "Liam Patel",
    email: "liam.patel@northbridge.edu",
    role: "student",
    department: "Engineering",
    phone: "+1 (415) 555-0136",
  },
  {
    _id: "000000000000000000000007",
    name: "Emma Johansson",
    email: "emma.johansson@northbridge.edu",
    role: "faculty",
    department: "Life Sciences",
    phone: "+1 (415) 555-0154",
  },
  {
    _id: "000000000000000000000008",
    name: "Noah Williams",
    email: "noah.williams@northbridge.edu",
    role: "employee",
    department: "Film Production",
    phone: "+1 (415) 555-0163",
  },
];

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=900&q=85`;

export const demoResources = [
  {
    _id: "000000000000000000000101",
    assetTag: "EQ-AV-0142",
    name: "Sony A7 IV Cinema Kit",
    description:
      "Full-frame mirrorless camera kit with two prime lenses, two batteries, and a 64GB card. A dependable choice for interviews, event coverage, and short-form production.",
    categoryId: "cat-av",
    location: "Media Lab 2",
    image: unsplash("1519183071298-a2962be90b8e"),
    totalQuantity: 6,
    availableQuantity: 3,
    status: "available",
    instructions:
      "Charge both batteries before use. Format the memory card in-camera, not on a computer. Return the kit in its hard case with the lens caps and strap included.",
    requirements: [
      "Completed media safety induction",
      "Booking request approved at least 24 hours in advance",
      "Valid student or staff ID at collection",
    ],
  },
  {
    _id: "000000000000000000000102",
    assetTag: "EQ-AV-0158",
    name: "Rode Wireless GO II Mic Kit",
    description:
      "Dual-channel wireless microphone system with two transmitters, a receiver, and lavalier clips. Ideal for on-location interviews and small crew shoots.",
    categoryId: "cat-av",
    location: "Studio A",
    image: unsplash("1520523839897-bd0b52f945a0"),
    totalQuantity: 10,
    availableQuantity: 8,
    status: "available",
    instructions:
      "Pair both transmitters before leaving the studio. Use the supplied windshields outdoors. Return each component to its labelled pouch.",
    requirements: [
      "Audio equipment handling briefing",
      "Bookings limited to 5 consecutive days",
    ],
  },
  {
    _id: "000000000000000000000103",
    assetTag: "EQ-AV-0163",
    name: "Shure MV7 Podcast Microphone",
    description:
      "Broadcast-style dynamic microphone with USB and XLR outputs. Suited to podcast recording, voiceover sessions, and remote interviews.",
    categoryId: "cat-av",
    location: "Studio B",
    image: unsplash("1598654890924-d1b6e4f3f5f2"),
    totalQuantity: 8,
    availableQuantity: 7,
    status: "available",
    instructions:
      "Use the supplied desk stand and USB-C cable. Speak 10–15 cm from the grille. Do not adjust the internal shock mount.",
    requirements: [
      "Studio orientation completed",
      "Headphones must be used for monitoring",
    ],
  },
  {
    _id: "000000000000000000000104",
    assetTag: "EQ-CP-0204",
    name: "MacBook Pro 16\" M3",
    description:
      "High-performance laptop for video editing, design work, and data analysis. Includes a 96W charger and a protective sleeve.",
    categoryId: "cat-computing",
    location: "Loan Desk A",
    image: unsplash("1496181133206-80ce9b88a853"),
    totalQuantity: 12,
    availableQuantity: 8,
    status: "available",
    instructions:
      "Sign in with your university account only. Do not install unlicensed software. Back up your work before returning the device.",
    requirements: [
      "Active student or staff account",
      "Signed device loan agreement",
      "Return by 5:00 PM on the booking end date",
    ],
  },
  {
    _id: "000000000000000000000105",
    assetTag: "EQ-CP-0218",
    name: "iPad Pro 12.9\" + Apple Pencil",
    description:
      "A 12.9-inch iPad Pro with Apple Pencil and Smart Folio, configured for field notes, sketching, and annotation work.",
    categoryId: "cat-computing",
    location: "Loan Desk A",
    image: unsplash("1561150964-4b7c9b6c7b3e"),
    totalQuantity: 15,
    availableQuantity: 14,
    status: "available",
    instructions:
      "Charge with the supplied USB-C cable. Keep the Pencil paired to the device. Wipe the screen with a microfibre cloth before return.",
    requirements: ["Device loan agreement", "Valid student or staff ID"],
  },
  {
    _id: "000000000000000000000106",
    assetTag: "EQ-CP-0231",
    name: "Meta Quest 3 VR Headset",
    description:
      "Standalone mixed-reality headset with two controllers and a charging dock, reserved primarily for teaching and research prototypes.",
    categoryId: "cat-computing",
    location: "Innovation Lab",
    image: unsplash("1593508512255-86ab42a8e620"),
    totalQuantity: 4,
    availableQuantity: 3,
    status: "available",
    instructions:
      "Clean the face gasket before and after use. Keep the headset out of direct sunlight. Charge controllers after each session.",
    requirements: [
      "VR lab induction",
      "Supervisor approval for off-campus use",
    ],
  },
  {
    _id: "000000000000000000000107",
    assetTag: "EQ-PR-0307",
    name: "Epson EB-PU1007 Projector",
    description:
      "High-brightness laser projector for large rooms and outdoor screenings. Includes HDMI and USB-C adapters and a remote.",
    categoryId: "cat-presentation",
    location: "AV Store",
    image: unsplash("1497366754035-f200968a6e72"),
    totalQuantity: 5,
    availableQuantity: 4,
    status: "available",
    instructions:
      "Allow the projector to cool down before packing. Use the supplied lens cap. Report any missing adapter at collection.",
    requirements: [
      "AV equipment briefing",
      "A power outlet must be available at the venue",
    ],
  },
  {
    _id: "000000000000000000000108",
    assetTag: "EQ-PR-0314",
    name: "Portable PA System",
    description:
      "Battery-powered 120W PA system with two wireless microphones and Bluetooth input. Suitable for outdoor events and pop-up sessions.",
    categoryId: "cat-presentation",
    location: "AV Store",
    image: unsplash("1470225620780-dba8ba36b745"),
    totalQuantity: 4,
    availableQuantity: 3,
    status: "available",
    instructions:
      "Charge the unit fully before collection. Keep the microphones in the side pocket. Avoid exposure to rain.",
    requirements: ["Event risk assessment", "Collection by a staff member"],
  },
  {
    _id: "000000000000000000000109",
    assetTag: "EQ-PR-0322",
    name: "Projector Screen 120\"",
    description:
      "Freestanding 120-inch projection screen with a wheeled carry case. Sets up in under five minutes with two people.",
    categoryId: "cat-presentation",
    location: "AV Store",
    image: unsplash("1489599849927-2ee91a2b6d0a"),
    totalQuantity: 6,
    availableQuantity: 5,
    status: "available",
    instructions:
      "Unfold on a flat surface and lock both legs before raising the screen. Do not force the retraction mechanism.",
    requirements: ["Two-person collection recommended"],
  },
  {
    _id: "000000000000000000000110",
    assetTag: "EQ-MD-0402",
    name: "DJI Mavic 3 Pro Drone",
    description:
      "Professional drone with a triple-camera system, intelligent flight batteries, and a controller. Flights must comply with campus airspace policy.",
    categoryId: "cat-media",
    location: "Media Cage",
    image: unsplash("1508614589041-895b88991e3e"),
    totalQuantity: 3,
    availableQuantity: 1,
    status: "available",
    instructions:
      "Complete the pre-flight checklist with an AV technician. Do not fly above 120 m or within restricted zones. Return all three batteries at 30% charge.",
    requirements: [
      "Remote pilot certification",
      "Approved campus flight plan",
      "Booking approved at least 48 hours in advance",
    ],
  },
  {
    _id: "000000000000000000000111",
    assetTag: "EQ-MD-0411",
    name: "DJI RS 3 Gimbal",
    description:
      "Three-axis camera stabiliser with a quick-release plate and focus motor. Supports mirrorless bodies and compact cinema cameras.",
    categoryId: "cat-media",
    location: "Media Cage",
    image: unsplash("1502982720700-bfff97f2ecac"),
    totalQuantity: 6,
    availableQuantity: 6,
    status: "available",
    instructions:
      "Balance the camera before powering on. Store the gimbal in its case with the axes locked. Do not carry it by the tilt arm.",
    requirements: ["Camera handling briefing"],
  },
  {
    _id: "000000000000000000000112",
    assetTag: "EQ-MD-0425",
    name: "Aputure 300D Light Kit",
    description:
      "Two-head LED lighting kit with softboxes, stands, and diffusers. Delivers daylight-balanced output for studio and location shoots.",
    categoryId: "cat-media",
    location: "Studio C",
    image: unsplash("1598654890924-d1b6e4f3f5f2"),
    totalQuantity: 6,
    availableQuantity: 4,
    status: "available",
    instructions:
      "Allow lamps to cool before packing. Use gloves when handling the COB light. Sandbag each stand outdoors.",
    requirements: [
      "Studio safety induction",
      "Two-person collection recommended",
    ],
  },
  {
    _id: "000000000000000000000113",
    assetTag: "EQ-RL-0508",
    name: "Olympus BX53 Microscope",
    description:
      "Research-grade upright microscope with LED illumination and a five-objective turret. Reserved for scheduled laboratory sessions.",
    categoryId: "cat-research",
    location: "Bio Lab 1",
    image: unsplash("1532094349884-543bc11b234d"),
    totalQuantity: 4,
    availableQuantity: 4,
    status: "available",
    instructions:
      "Use only the supplied lens cloth. Lower the stage before changing objectives. Log the session in the lab notebook.",
    requirements: [
      "Laboratory safety induction",
      "Supervisor sign-off for external samples",
    ],
  },
  {
    _id: "000000000000000000000114",
    assetTag: "EQ-RL-0521",
    name: "Prusa MK4 3D Printer",
    description:
      "FDM 3D printer with a 250 × 210 × 220 mm build volume. Filament is supplied; print files must be reviewed before queuing.",
    categoryId: "cat-research",
    location: "Fabrication Lab",
    image: unsplash("1631556097152-c9b4f2c47c8b"),
    totalQuantity: 5,
    availableQuantity: 3,
    status: "available",
    instructions:
      "Run the first-layer calibration before every print. Do not leave the printer unattended for prints over two hours. Clean the build plate after use.",
    requirements: [
      "Fabrication lab induction",
      "Print file reviewed by a lab technician",
    ],
  },
  {
    _id: "000000000000000000000115",
    assetTag: "EQ-RL-0534",
    name: "Fluke Ti480 Thermal Camera",
    description:
      "Handheld thermal imaging camera for building surveys, electronics diagnostics, and field research. Includes a rugged carry case.",
    categoryId: "cat-research",
    location: "Engineering Store",
    image: unsplash("1581091226825-a6a2a5aee158"),
    totalQuantity: 3,
    availableQuantity: 3,
    status: "available",
    instructions:
      "Allow the camera to acclimatise before measuring. Export images before returning. Keep the lens protected when not in use.",
    requirements: ["Fieldwork safety briefing", "Supervisor approval"],
  },
  {
    _id: "000000000000000000000116",
    assetTag: "EQ-AV-0171",
    name: "Focusrite Scarlett 18i20 Interface",
    description:
      "Eighteen-input USB audio interface for multi-track recording, podcast sessions, and live capture. Recently added to the loan pool.",
    categoryId: "cat-av",
    location: "Studio B",
    image: unsplash("1598654890924-d1b6e4f3f5f2"),
    totalQuantity: 7,
    availableQuantity: 7,
    status: "available",
    instructions:
      "Install the Focusrite Control software before connecting. Use balanced cables for monitors. Return the power supply and USB cable.",
    requirements: ["Audio studio orientation", "Bookings limited to 7 days"],
  },
  {
    _id: "000000000000000000000117",
    assetTag: "EQ-RL-0541",
    name: "Tektronix TBS2000 Oscilloscope",
    description:
      "Digital oscilloscope with two channels and a 9-inch display. Currently withdrawn from the loan pool for calibration and probe replacement.",
    categoryId: "cat-research",
    location: "Engineering Store",
    image: unsplash("1581092160562-40aa08e78837"),
    totalQuantity: 4,
    availableQuantity: 0,
    status: "maintenance",
    instructions:
      "Unavailable until calibration is complete. Contact the engineering store for the expected return date.",
    requirements: ["Electronics lab induction"],
  },
];
