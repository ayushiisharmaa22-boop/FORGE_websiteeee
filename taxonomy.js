/*
  Forge taxonomy
  --------------
  SECTORS   groups the 5-digit NIC activity codes (by their first two digits) into
            plain-language sectors, and says which faculty expertise helps that sector.
  EXPERT    the expertise areas, detected in each faculty member's field/specialisation text.
  SYN       search synonyms (including a few Hindi words) so "kapda" or "murgi" still work.

  Edit this file if you want to change how a sector maps to faculty expertise.
*/
window.FORGE_TAXONOMY = (() => {
  const EXPERT = [
    { id: 'ai',   label: 'AI & Machine Learning',        re: /machine learning|deep learning|artificial intelligence|\bai\b|soft computing|genetic algorithm|nature-inspired/ },
    { id: 'data', label: 'Data Science & Analytics',     re: /data (science|mining|analytics|analysis|warehouse)|business analytics|business intelligence|predictive|data-driven|information retrieval/ },
    { id: 'cv',   label: 'Computer Vision',              re: /computer vision|image processing|image forensics/ },
    { id: 'nlp',  label: 'Language & Text AI',           re: /natural language|\bnlp\b|text mining/ },
    { id: 'iot',  label: 'IoT, Sensors & Automation',    re: /\biot\b|internet of things|embedded|automation|sensor|cyber[- ]physical|real[- ]time/ },
    { id: 'sec',  label: 'Cybersecurity & Blockchain',   re: /cyber ?security|information security|network security|blockchain|trust computing/ },
    { id: 'soft', label: 'Software, Cloud & Databases',  re: /cloud|software engineering|database|web programming|high performance|distributed|fog computing|mobile computing/ },
    { id: 'net',  label: 'Networks & Wireless',          re: /wireless|computer networks|networking|manet|vanet|antenna|telecommunication/ },
    { id: 'ux',   label: 'UI/UX & Design',               re: /ui\/ux|ui-ux|\bhci\b|human computer/ },
    { id: 'or',   label: 'Operations Research',          re: /operations research|optimi[sz]ation|decision making/ },
    { id: 'math', label: 'Mathematical Modelling',       re: /mathematic|calculus|algebra|dynamical|fluid|similarity analysis|heat & mass|functional analysis|fixed point/ },
    { id: 'chem', label: 'Chemistry & Nanomaterials',    re: /chemistry|electrochem|nano|materials/ },
    { id: 'fin',  label: 'Finance & Accounting',         re: /financ|accounting|banking|economics|costing/ },
    { id: 'mkt',  label: 'Marketing & Sales',            re: /marketing|consumer behavio|sales management/ },
    { id: 'hr',   label: 'Management, HR & Communication', re: /human resource|business communication|managerial communication|organizational communication|general management|\bhrm\b/ },
  ];

  // help: [expertise id, plain-language reason], most useful first
  const SECTORS = [
    { id: 'agri', name: 'Agriculture, Livestock & Fisheries', div: [1, 2, 3, 75], kw: 'agriculture livestock fishery',
      help: [['iot', 'Sensors for poultry sheds, farms and water'], ['ai', 'Predicting disease, yield and feed needs'], ['cv', 'Camera-based monitoring of animals and crops'], ['data', 'Forecasting output and market prices'], ['math', 'Modelling growth, irrigation and heat flow']] },
    { id: 'food', name: 'Food & Beverages', div: [10, 11, 12], kw: 'food processing beverage',
      help: [['chem', 'Preservation, shelf life and food chemistry'], ['iot', 'Monitoring temperature and processing lines'], ['cv', 'Quality grading by camera'], ['mkt', 'Packaging, branding and finding buyers'], ['fin', 'Costing and pricing']] },
    { id: 'textile', name: 'Textiles & Handloom', div: [13], kw: 'textile handloom fabric',
      help: [['cv', 'Spotting fabric defects and digitising patterns'], ['data', 'Forecasting demand and design trends'], ['or', 'Loom and production scheduling'], ['mkt', 'Reaching buyers beyond the local market'], ['chem', 'Dyes, fibre treatment and finishing'], ['fin', 'Costing and pricing']] },
    { id: 'garment', name: 'Garments & Tailoring', div: [14], kw: 'garment apparel clothing',
      help: [['mkt', 'Branding and selling to new customers'], ['or', 'Cutting and production planning'], ['soft', 'Setting up an online store'], ['ux', 'Design tools and catalogues'], ['fin', 'Costing and pricing']] },
    { id: 'leather', name: 'Leather & Footwear', div: [15], kw: 'leather footwear',
      help: [['chem', 'Tanning and finishing chemistry'], ['mkt', 'Branding and market linkage'], ['fin', 'Costing and pricing']] },
    { id: 'wood', name: 'Wood, Bamboo & Furniture', div: [16, 31], kw: 'wood bamboo cane furniture',
      help: [['or', 'Cutting layouts that waste less material'], ['ux', 'Product design and catalogues'], ['mkt', 'Reaching buyers outside the district'], ['soft', 'Online ordering'], ['math', 'Structural and material modelling']] },
    { id: 'paper', name: 'Paper & Printing', div: [17, 18], kw: 'paper printing',
      help: [['ux', 'Layout and design tooling'], ['mkt', 'Finding and keeping clients'], ['soft', 'Online order systems']] },
    { id: 'chem', name: 'Chemicals, Pharma & Plastics', div: [19, 20, 21, 22], kw: 'chemical pharma plastic',
      help: [['chem', 'Formulation, materials and process chemistry'], ['math', 'Heat, mass and fluid-flow modelling'], ['iot', 'Process monitoring and automation'], ['data', 'Process optimisation from plant data']] },
    { id: 'mineral', name: 'Mining, Cement & Stone', div: [5, 6, 7, 8, 9, 23], kw: 'mining cement stone brick',
      help: [['math', 'Modelling strength, flow and heat'], ['chem', 'Materials testing and mix design'], ['iot', 'Equipment monitoring'], ['or', 'Planning and logistics']] },
    { id: 'metal', name: 'Metals & Fabrication', div: [24, 25], kw: 'metal fabrication',
      help: [['iot', 'Automation and machine monitoring'], ['math', 'Heat transfer and stress modelling'], ['chem', 'Materials and coatings'], ['or', 'Production planning']] },
    { id: 'mach', name: 'Machinery, Electronics & Vehicles', div: [26, 27, 28, 29, 30, 33], kw: 'machinery electronics vehicle repair',
      help: [['iot', 'Embedded systems and automation'], ['net', 'Wireless and communication hardware'], ['ai', 'Fault prediction and diagnostics'], ['data', 'Service and spare-parts analytics']] },
    { id: 'jewel', name: 'Jewellery & Other Manufacturing', div: [32], kw: 'jewellery handicraft',
      help: [['mkt', 'Branding and selling to new customers'], ['cv', 'Digitising designs and quality checks'], ['fin', 'Costing and gold-price risk'], ['soft', 'Online store']] },
    { id: 'energy', name: 'Energy, Water & Waste', div: [35, 36, 37, 38, 39], kw: 'energy water waste',
      help: [['chem', 'Energy materials and treatment chemistry'], ['iot', 'Metering and monitoring'], ['data', 'Demand and usage analytics']] },
    { id: 'constr', name: 'Construction', div: [41, 42, 43], kw: 'construction building',
      help: [['or', 'Scheduling and resource planning'], ['math', 'Structural and material modelling'], ['fin', 'Project costing'], ['data', 'Estimating and tracking']] },
    { id: 'trade', name: 'Trade & Retail', div: [45, 46, 47], kw: 'retail wholesale',
      help: [['data', 'Stock and demand forecasting'], ['mkt', 'Customer insight and promotion'], ['soft', 'Billing, inventory and online stores'], ['sec', 'Safe digital payments'], ['fin', 'Margins and working capital']] },
    { id: 'transport', name: 'Transport & Logistics', div: [49, 50, 51, 52, 53], kw: 'transport logistics',
      help: [['or', 'Route and load planning'], ['iot', 'Vehicle tracking'], ['data', 'Demand and delivery analytics']] },
    { id: 'hosp', name: 'Hotels, Restaurants & Catering', div: [55, 56], kw: 'hotel restaurant catering',
      help: [['mkt', 'Customer insight and promotion'], ['ux', 'Menus, booking and apps'], ['data', 'Demand and waste forecasting'], ['hr', 'Staff training and service']] },
    { id: 'it', name: 'IT, Media & Telecom', div: [58, 59, 60, 61, 62, 63], kw: 'software digital computer',
      help: [['ai', 'Building and applying ML in products'], ['soft', 'Cloud, databases and software engineering'], ['sec', 'Security reviews'], ['nlp', 'Language and text tools'], ['ux', 'Product design and usability']] },
    { id: 'fin', name: 'Finance & Insurance', div: [64, 65, 66], kw: 'finance insurance',
      help: [['fin', 'Accounting and financial analysis'], ['sec', 'Secure transactions and fraud'], ['data', 'Risk and customer analytics'], ['ai', 'Credit and fraud models']] },
    { id: 'prof', name: 'Professional & Technical Services', div: [68, 69, 70, 71, 72, 73, 74], kw: 'professional consultancy',
      help: [['data', 'Analytics and reporting'], ['soft', 'Workflow and document systems'], ['hr', 'Management and communication'], ['fin', 'Accounting and costing']] },
    { id: 'support', name: 'Business Support Services', div: [77, 78, 79, 80, 81, 82], kw: 'business support services',
      help: [['hr', 'Staffing, training and communication'], ['soft', 'Workflow and booking systems'], ['fin', 'Accounting and costing']] },
    { id: 'edu', name: 'Education & Training', div: [85], kw: 'education training',
      help: [['ai', 'Adaptive learning and assessment tools'], ['nlp', 'Language learning and content tools'], ['ux', 'Learning app design'], ['soft', 'Online platforms'], ['hr', 'Teaching and communication skills']] },
    { id: 'health', name: 'Health & Social Care', div: [86, 87, 88], kw: 'health medical care',
      help: [['cv', 'Image-based screening'], ['ai', 'Diagnostic and risk models'], ['data', 'Patient and stock analytics'], ['iot', 'Remote monitoring']] },
    { id: 'arts', name: 'Arts, Sports & Recreation', div: [90, 91, 92, 93], kw: 'arts sports recreation',
      help: [['ux', 'Apps and digital experiences'], ['mkt', 'Audience building and promotion'], ['cv', 'Video and image tools']] },
    { id: 'other', name: 'Other Services', div: [], kw: 'personal services',
      help: [['mkt', 'Finding and keeping customers'], ['soft', 'Booking and billing tools'], ['hr', 'Training and communication']] },
  ];

  // Search synonyms. Keys are lowercase, singular. Each value is the list of words to look for.
  const SYN = {
    wool: ['wool', 'woollen', 'woolen'], woolen: ['wool', 'woollen', 'woolen'], woollen: ['wool', 'woollen', 'woolen'], oon: ['wool'],
    garment: ['garment', 'apparel', 'clothing', 'tailoring'], cloth: ['cloth', 'fabric', 'textile', 'weaving', 'garment'],
    clothe: ['garment', 'apparel', 'clothing', 'tailoring'], clothes: ['garment', 'apparel', 'clothing', 'tailoring'],
    clothing: ['garment', 'apparel', 'clothing'], dress: ['garment', 'apparel', 'clothing', 'tailoring'],
    kapda: ['textile', 'fabric', 'garment', 'cloth', 'apparel'], kapde: ['textile', 'fabric', 'garment', 'cloth', 'apparel'],
    silai: ['tailoring', 'garment', 'stitch'], bunai: ['weaving', 'knit', 'fabric'], resham: ['silk'],
    fabric: ['fabric', 'textile', 'weaving'], handloom: ['handloom', 'weaving', 'textile'],
    poultry: ['poultry', 'egg', 'chicken', 'hatcher'], murgi: ['poultry', 'chicken', 'egg'], murghi: ['poultry', 'chicken', 'egg'],
    anda: ['egg'], ande: ['egg'], egg: ['egg'], shahad: ['honey', 'bee'], honey: ['honey', 'bee'],
    machli: ['fish'], doodh: ['milk', 'dairy'], milk: ['milk', 'dairy'], dairy: ['milk', 'dairy'],
    lakdi: ['wood', 'timber'], baans: ['bamboo', 'cane'], bamboo: ['bamboo', 'cane'], cane: ['cane', 'bamboo'],
    sona: ['gold', 'jewellery'], jewelry: ['jewellery', 'jewelry'], gold: ['gold', 'jewellery'],
    sabzi: ['vegetable'], phal: ['fruit'], chawal: ['rice', 'cereal'], rice: ['rice', 'cereal'],
    dawai: ['pharma', 'medicin', 'drug'], dawa: ['pharma', 'medicin', 'drug'], medicine: ['pharma', 'medicin', 'drug'],
    kheti: ['agricultur', 'crop', 'farming', 'cultivation'], farming: ['agricultur', 'crop', 'farming', 'cultivation'],
    pashu: ['animal', 'livestock', 'veterinary'], pig: ['pig', 'piggery', 'swine'], piggery: ['pig', 'piggery', 'swine'],
    computer: ['computer', 'software', 'information technology'], software: ['software', 'computer', 'information technology'],
    tailor: ['tailor'], shop: ['retail', 'store', 'shop'], store: ['retail', 'store', 'shop'],
    plastic: ['plastic'], electric: ['electric'], steel: ['steel', 'iron', 'metal'], car: ['motor vehicle', 'automobile'],
    // faculty-side
    ai: ['ai', 'artificial intelligence'], ml: ['machine learning'], maths: ['mathematic'], math: ['mathematic'],
    iot: ['iot', 'internet of things'], vision: ['computer vision', 'image processing'], marketing: ['marketing'],
    chemistry: ['chemistry', 'chemical'], accounting: ['accounting', 'costing'], finance: ['financ'], hr: ['human resource'],
  };

  return { EXPERT, SECTORS, SYN };
})();
