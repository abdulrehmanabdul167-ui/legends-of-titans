// Legends of Iron - Character and Stage Database
window.GameDatabase = {
  characters: [
    {
      id: "ironfist",
      name: "IRON FIST V",
      title: "The Chrome Brawler",
      style: "Cybernetic Boxing & Muay Thai",
      bio: "A cybernetically enhanced champion from the underground neon rings of Neo-Detroit. He fights to shut down the mega-corporation that forcefully modified him.",
      stats: { power: 9, speed: 6, defense: 7, difficulty: 4 },
      colors: { primary: "#00ffcc", secondary: "#330066", glow: "#00ffcc" },
      moves: [
        { name: "Piston Hook", combo: "P, P", desc: "Fast double punch combo" },
        { name: "Turbo Uppercut", combo: "Down-Forward + P", desc: "Launches opponent into the air" },
        { name: "Steel Knee", combo: "Forward + K", desc: "Heavy forward thrusting knee" },
        { name: "Overdrive Slam", combo: "Grab (G)", desc: "Close range power throw" },
        { name: "Overload Breaker", combo: "Special (S)", desc: "Releases an energy burst (projectile)" },
        { name: "IRON DOME ULTIMATE", combo: "Ultimate (U)", desc: "Cinematic barrage of explosive cyber punches" }
      ],
      playable: true
    },
    {
      id: "nebula",
      name: "NEBULA",
      title: "The Stellar Assassin",
      style: "Dual Plasma Dagger Ninjutsu",
      bio: "An elite shadow operative trained in orbital stealth. She manipulates light and speed to strike her targets from the dark.",
      stats: { power: 6, speed: 10, defense: 5, difficulty: 8 },
      colors: { primary: "#ff007f", secondary: "#1a0033", glow: "#ff007f" },
      moves: [
        { name: "Stardust Slash", combo: "P, K", desc: "Quick slash followed by a roundhouse" },
        { name: "Cosmic Dash", combo: "Forward-Forward", desc: "Teleport dash that passes through attacks" },
        { name: "Shadow Kick", combo: "Down-Back + K", desc: "Low slide kick that trips opponents" },
        { name: "Astral Flip", combo: "Grab (G)", desc: "Acrobatic neck-breaker throw" },
        { name: "Nebula Burst", combo: "Special (S)", desc: "Launches three homing plasma sparks" },
        { name: "SUPERNOVA ENDING", combo: "Ultimate (U)", desc: "Teleports behind and executes a 20-hit combo" }
      ],
      playable: true
    },
    {
      id: "jadesentinel",
      name: "JADE SENTINEL",
      title: "The Bastion of Light",
      style: "Ancient Qi Gong & Heavy Shield Kicks",
      bio: "Guardian of the Sacred Temple of Jade. He channels spiritual energy into an indestructible jade shield and performs heavy kinetic strikes.",
      stats: { power: 7, speed: 5, defense: 10, difficulty: 6 },
      colors: { primary: "#39ff14", secondary: "#0d2611", glow: "#39ff14" },
      moves: [
        { name: "Fortress Shield", combo: "Back + B", desc: "Perfect block that reflects projectile damage" },
        { name: "Sentinel Stomp", combo: "Down + K", desc: "Earth-shaking stomp hitting low" },
        { name: "Jade Thrust", combo: "Forward + P", desc: "Shield bash that knocks opponents back" },
        { name: "Mountain Toss", combo: "Grab (G)", desc: "Throws opponent over the shoulder" },
        { name: "Qi barrier", combo: "Special (S)", desc: "Creates a temporary shield absorbing one hit" },
        { name: "EMPEROR'S JUDGMENT", combo: "Ultimate (U)", desc: "Summons a giant jade pillar crushing the enemy" }
      ],
      playable: true
    },
    {
      id: "cybersamurai",
      name: "KENDJI-X",
      title: "The Ronin Prototype",
      style: "Kendo & Cybernetic Katana Arts",
      bio: "A rogue military prototype robot that gained consciousness. Armed with a high-frequency plasma blade, he seeks the meaning of honor.",
      stats: { power: 8, speed: 7, defense: 6, difficulty: 5 },
      colors: { primary: "#ffea00", secondary: "#2c2c2c", glow: "#ffea00" },
      moves: [
        { name: "Zan-Tetsu", combo: "P, P, K", desc: "Three-hit katana slash combo" },
        { name: "Wind-Run Thrust", combo: "Forward + P", desc: "Lunge forward with an electric pierce" },
        { name: "Steel Sweep", combo: "Down + K", desc: "Katana sweep aimed at legs" },
        { name: "Hilt Crush", combo: "Grab (G)", desc: "Stuns enemy and executes a clean slash" },
        { name: "Laser Slash", combo: "Special (S)", desc: "Fires a vertical energy wave" },
        { name: "OMEGA BLADE SLASH", combo: "Ultimate (U)", desc: "Slashes screen in slow motion, cutting the fabric of space" }
      ],
      playable: true
    },
    // The other 26 original characters to represent the complete roster
    {
      id: "vulcan",
      name: "VULCAN",
      title: "The Magma Titan",
      style: "Fire Boxing & Magma Grappling",
      bio: "An ancient elemental champion awakened by the volcanic magma shifts in the Crater of Vulcan. He channels intense geothermal heat into molten obsidian punches.",
      stats: { power: 10, speed: 4, defense: 8, difficulty: 5 },
      colors: { primary: "#ff3300", secondary: "#1a1210", glow: "#ff4500" },
      moves: [
        { name: "Magma Jab", combo: "P, P", desc: "Double heavy punch combo" },
        { name: "Volcanic Eruption", combo: "Down-Forward + P", desc: "Magma-charged uppercut launching the opponent" },
        { name: "Lava Sweep", combo: "Down + K", desc: "Low sweeps using molten ground flows" },
        { name: "Crater Slam", combo: "Grab (G)", desc: "Lifts and slams opponent into the floor" },
        { name: "Ember Projectile", combo: "Special (S)", desc: "Fires a volcanic fireball" },
        { name: "METEOR IMPACT ULTIMATE", combo: "Ultimate (U)", desc: "Slam-dives creating magma explosions and deep cracks" }
      ],
      playable: true
    },
    {
      id: "tigris",
      name: "TIGRIS",
      title: "The Crimson Tiger",
      style: "Feral Plasma Claw Ninjutsu",
      bio: "A bio-engineered cybernetic tiger hybrid who escaped from corporate laboratories. Equipped with plasma claws, he fights to liberate his hybrid pack.",
      stats: { power: 7, speed: 9, defense: 6, difficulty: 6 },
      colors: { primary: "#ff7a00", secondary: "#101015", glow: "#ff4400" },
      moves: [
        { name: "Tiger Claw Strike", combo: "P, P", desc: "Quick double slash with plasma claws" },
        { name: "Feral Pounce", combo: "Forward + P", desc: "Lungs forward slicing the opponent" },
        { name: "Tail Sweep", combo: "Down + K", desc: "Sweeps legs using his dynamic tail" },
        { name: "Apex Vault", combo: "Grab (G)", desc: "Pounces and executes a high-speed neck throw" },
        { name: "Plasma Razor", combo: "Special (S)", desc: "Launches a flying slash blade of plasma" },
        { name: "HUNTER'S FRENZY ULTIMATE", combo: "Ultimate (U)", desc: "Wild flurry of slashes tearing through the opponent" }
      ],
      playable: true
    },
    { id: "raiden", name: "RAIDEN-Z", title: "Lightning Ronin", style: "Thunder Katana", playable: false, colors: { primary: "#00ccff", glow: "#00ccff" } },
    { id: "tesla", name: "TESLA", title: "The EMP Specialist", style: "Electric Jitsu", playable: false, colors: { primary: "#bf00ff", glow: "#bf00ff" } },
    { id: "tsunami", name: "TSUNAMI", title: "The Hydro Hunter", style: "Water Flow Kung Fu", playable: false, colors: { primary: "#0066ff", glow: "#0066ff" } },
    { id: "viper", name: "VIPER", title: "Venomous Stalker", style: "Acid Claws", playable: false, colors: { primary: "#99cc00", glow: "#99cc00" } },
    { id: "reaper", name: "REAPER", title: "The Soul Harvester", style: "Dark Scythe Art", playable: false, colors: { primary: "#404040", glow: "#ff0000" } },
    { id: "phantom", name: "PHANTOM", title: "Holographic Mirage", style: "Distortion Martial Arts", playable: false, colors: { primary: "#ff00ff", glow: "#ff00ff" } },
    { id: "titan", name: "TITAN", title: "The Exo-Colossus", style: "Heavy Grappling", playable: false, colors: { primary: "#ff6600", glow: "#ff6600" } },
    { id: "nyx", name: "NYX", title: "Goddess of Shadow", style: "Gravity Manipulation", playable: false, colors: { primary: "#2c3e50", glow: "#9b59b6" } },
    { id: "blaze", name: "BLAZE", title: "The Ignition Kickboxer", style: "Inferno Kickboxing", playable: false, colors: { primary: "#e74c3c", glow: "#f1c40f" } },
    { id: "frost", name: "FROST", title: "The Cryo Enforcer", style: "Ice Hammer Brawling", playable: false, colors: { primary: "#ecf0f1", glow: "#3498db" } },
    { id: "apex", name: "APEX", title: "The Nanotech Hunter", style: "Adaptive Combat", playable: false, colors: { primary: "#1abc9c", glow: "#2ecc71" } },
    { id: "chrono", name: "CHRONO", title: "The Time Warden", style: "Hourglass Fencing", playable: false, colors: { primary: "#f39c12", glow: "#d35400" } },
    { id: "spectrum", name: "SPECTRUM", title: "The Prism Weaver", style: "Laser Ring Arts", playable: false, colors: { primary: "#9b59b6", glow: "#8e44ad" } },
    { id: "goliath", name: "GOLIATH", title: "The Steel Fortress", style: "Defense Brawling", playable: false, colors: { primary: "#7f8c8d", glow: "#bdc3c7" } },
    { id: "quiver", name: "QUIVER", title: "Sonic Archer", style: "Sonic Bow Combat", playable: false, colors: { primary: "#27ae60", glow: "#2ecc71" } },
    { id: "hazmat", name: "HAZMAT", title: "The Toxic Chemist", style: "Bio-hazard Brawling", playable: false, colors: { primary: "#d35400", glow: "#f1c40f" } },
    { id: "trinity", name: "TRINITY", title: "The Tri-Core AI", style: "Vector Punching", playable: false, colors: { primary: "#34495e", glow: "#1abc9c" } },
    { id: "pulse", name: "PULSE", title: "The Heartbeat Hacker", style: "Sonic Wave Kicks", playable: false, colors: { primary: "#e74c3c", glow: "#9b59b6" } },
    { id: "zenith", name: "ZENITH", title: "The Solar Sentinel", style: "Solar Flare Kung Fu", playable: false, colors: { primary: "#f1c40f", glow: "#e67e22" } },
    { id: "eclipse", name: "ECLIPSE", title: "Lunar Shaman", style: "Umbral Claw Boxing", playable: false, colors: { primary: "#34495e", glow: "#2c3e50" } },
    { id: "vector", name: "VECTOR", title: "Gravity Breaker", style: "Magnet Wrestling", playable: false, colors: { primary: "#1abc9c", glow: "#3498db" } },
    { id: "inferno", name: "INFERNO", title: "Lord of Ash", style: "Volcanic Grappling", playable: false, colors: { primary: "#c0392b", glow: "#d35400" } },
    { id: "mirage", name: "MIRAGE", title: "The Desert Phantom", style: "Sand Shifting Tai Chi", playable: false, colors: { primary: "#e67e22", glow: "#f39c12" } },
    { id: "cyclone", name: "CYCLONE", title: "Wind Weaver", style: "Tornado Capoeira", playable: false, colors: { primary: "#2ecc71", glow: "#1abc9c" } },
    { id: "ironclad", name: "IRONCLAD", title: "The Bastion", style: "Heavy Iron Shielding", playable: false, colors: { primary: "#95a5a6", glow: "#7f8c8d" } }
  ],

  arenas: [
    {
      id: "cybercity",
      name: "NEON SHIBUYA",
      desc: "A futuristic cityscape with towering digital billboards, rain-slicked chrome asphalt, and active holographic traffic under neon purple lights.",
      skyColor: "#050014",
      floorColor: "#100d23",
      glowColor: "#ff00ff",
      weather: "Rainy",
      timeOfDay: "Midnight",
      playable: true
    },
    {
      id: "lavadojo",
      name: "CRATER OF VULCAN",
      desc: "A stone temple platform suspended above a boiling volcanic magma lake. Sparks rise from the lava as active volcanic ash falls from the sky.",
      skyColor: "#1d0500",
      floorColor: "#321105",
      glowColor: "#ff3300",
      weather: "Volcanic Ash",
      timeOfDay: "Sunset",
      playable: true
    },
    {
      id: "ancientdojo",
      name: "CHERRY BLOSSOM PALACE",
      desc: "An outdoor wooden dojo deck surrounded by glowing paper lanterns, ancient rock gardens, and falling cherry blossom petals in a moonlit evening.",
      skyColor: "#030c18",
      floorColor: "#42281a",
      glowColor: "#ff99cc",
      weather: "Falling Petals",
      timeOfDay: "Morning",
      playable: true
    },
    // Other 17 arenas to fill the selection screen
    { id: "rooftop", name: "SKYLINE ROOFTOP", desc: "A high-rise skyscraper helipad.", playable: false },
    { id: "snow", name: "GLACIER PEAK", desc: "A snow-covered mountaintop with blizzards.", playable: false },
    { id: "desert", name: "RUINS OF GIZA", desc: "Desert ruins at sunset with blowing sand.", playable: false },
    { id: "factory", name: "INDUSTRIAL FOUNDRY", desc: "A heavy machinery assembly line.", playable: false },
    { id: "jungle", name: "JUNGLE OF MAYA", desc: "Overgrown ancient ruins with waterfall.", playable: false },
    { id: "market", name: "NEON NIGHT MARKET", desc: "Densely packed street market stalls.", playable: false },
    { id: "harbor", name: "MEGAPORT 9", desc: "Heavy shipping containers dock side.", playable: false },
    { id: "castle", name: "IRON FORTRESS", desc: "A medieval castle hallway with torches.", playable: false },
    { id: "spacestation", name: "ORBITAL BAY", desc: "Inside an orbital ring facing Earth.", playable: false },
    { id: "underground", name: "SECTOR 13 LAB", desc: "A high-tech lab with containment tanks.", playable: false },
    { id: "waterfall", name: "MYSTIC FALLS", desc: "Under a massive tropical waterfall cave.", playable: false },
    { id: "palace", name: "GOLDEN TEMPLE", desc: "An imperial golden throne room.", playable: false },
    { id: "airport", name: "NEO-TOKYO AIRPORT", desc: "Fighter jets hangar and runway.", playable: false },
    { id: "stadium", name: "COLOSSEUM OF IRON", desc: "A massive futuristic sports arena.", playable: false },
    { id: "subway", name: "METRO DEPOT", desc: "An abandoned subway station.", playable: false },
    { id: "powerplant", name: "REACTOR CORE", desc: "A humming nuclear fusion reactor.", playable: false },
    { id: "canyon", name: "GRAND CANYON RIFT", desc: "Dusty gorge suspension bridge.", playable: false }
  ]
};
