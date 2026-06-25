# Data Set vs MongoDB vs Qdrant Audit Report

> Generated: 2026-05-29

## Summary

| Metric | Count |
|---|---|
| Data Set PDFs | 934 |
| MongoDB chapters | 625 |
| Qdrant unique chapter_ids | 378 |
| In MongoDB but NOT in Qdrant | **247** |
| MongoDB chapters with NO matching PDF in Data Set | **91** |

---

## Part 1: Chapters in MongoDB but NOT in Qdrant

These chapters exist in the DB but were **never uploaded/ingested** into the vector store.

### Class 6th (34 chapters)

| Subject | Chapter |
|---|---|
| English | A Bottle of Dew |
| English | A Friend's Prayer |
| English | Change of Heart |
| English | Hamara Bharat - Incredible India! |
| English | Ila Sachani: Embroidering Dreams with her Feet |
| English | National War Memorial |
| English | Neem Baba |
| English | Spices that Heal Us |
| English | The Chair |
| English | The Kites |
| English | The Raven and the Fox |
| English | The Winner |
| English | What a Bird Thought |
| English | Yoga - A Way of Life |
| Hindi | गोल |
| Hindi | चेतक की वीरता |
| Hindi | जलाते चलो |
| Hindi | परीक्षा |
| Hindi | पहली बूँद |
| Hindi | मातृभूमि |
| Hindi | मेरी माँ |
| Hindi | मैया मैं नहिं माखन खायो |
| Hindi | रहीम के दोहे |
| Hindi | सत्रिया और बिहू नृत्य |
| Hindi | हार की जीत |
| Hindi | हिंद महासागर में छोटा-सा हिंदुस्तान |
| Mathematics | Patterns in Mathematics |
| Science | Mindful Eating: A Path to a Healthy Body |
| Science | Temperature and its Measurement |
| Social Studies | Grassroots Democracy — Part 2: Local Government in Rural Areas |
| Social Studies | Grassroots Democracy — Part 3: Local Government in Urban Areas |
| Social Studies | India's Cultural Roots |
| Social Studies | Unity in Diversity, or 'Many in the One' |

### Class 7th (43 chapters)

| Subject | Chapter |
|---|---|
| English | A Funny Man |
| English | A Homage to Our Brave Soldiers |
| English | Animals, Birds, and Dr. Dolittle |
| English | Conquering the Summit |
| English | My Brother's Great Invention |
| English | My Dear Soldiers |
| English | North, South, East, West |
| English | Paper Boats |
| English | Rani Abbakka |
| English | Say the Right Thing |
| English | The Day the River Spoke |
| English | The Tunnel |
| English | Three Days to See |
| English | Travel |
| English | Try Again |
| Hindi | गिरिधर कविराय की कुंडलिया |
| Hindi | चिड़िया |
| Hindi | तीन बुद्धिमान |
| Hindi | नहीं होना बीमार |
| Hindi | पानी रे पानी |
| Hindi | फूल और काँटा |
| Hindi | बिरजू महाराज से साक्षात्कार |
| Hindi | माँ, कह एक कहानी |
| Hindi | मीरा के पद |
| Hindi | वर्षा-बहार |
| Mathematics | A Peek Beyond the Point |
| Mathematics | A Tale of Three Intersecting Lines |
| Mathematics | Another Peek Beyond the Point |
| Mathematics | Arithmetic Expressions |
| Mathematics | Connecting the Dots... |
| Mathematics | Constructions and Tilings |
| Mathematics | Expressions using Letter-Numbers |
| Mathematics | Finding Common Ground |
| Mathematics | Finding the Unknown |
| Mathematics | Geometric Twins |
| Mathematics | Large Numbers Around Us |
| Mathematics | Number Play |
| Mathematics | Operations with Integers |
| Mathematics | Parallel and Intersecting Lines |
| Mathematics | Working with Fractions |
| Science | Adolescence A Stage of Growth and Change |
| Science | Adolescence: A Stage of Growth and Change |
| Science | Changes Around Us Physical and Chemical |
| Science | Changes Around Us: Physical and Chemical |
| Science | Earth, Moon, and the Sun |
| Science | Electricity Circuits and their Components |
| Science | Electricity: Circuits and their Components |
| Science | Exploring Substances Acidic, Basic, and Neutral |
| Science | Exploring Substances: Acidic, Basic, and Neutral |
| Science | Heat Transfer in Nature |
| Science | Life Processes in Animals |
| Science | Life Processes in Plants |
| Science | Light Shadows and Reflections |
| Science | Light: Shadows and Reflections |
| Science | Measurement of Time and Motion |
| Science | The Ever-Evolving World of Science |
| Science | The World of Metals and Non-metals |
| Social Studies | Banks and the Magic of Finance |
| Social Studies | Climates of India |
| Social Studies | Empires and Kingdoms: 6th to 10th Centuries |
| Social Studies | From Barter to Money |
| Social Studies | From the Rulers to the Ruled Types of Governments |
| Social Studies | From the Rulers to the Ruled: Types of Governments |
| Social Studies | Geographical Diversity of India |
| Social Studies | How the Land Becomes Sacred |
| Social Studies | India and Her Neighbours |
| Social Studies | India, a Home to Many |
| Social Studies | Infrastructure: Engine of India's Development |
| Social Studies | New Beginnings Cities and States |
| Social Studies | New Beginnings: Cities and States |
| Social Studies | The Age of Reorganisation |
| Social Studies | The Constitution of India — An Introduction |
| Social Studies | The Gupta Era: An Age of Tireless Creativity |
| Social Studies | The Rise of Empires |
| Social Studies | The State, the Government, and You |
| Social Studies | The Story of Indian Farming |
| Social Studies | Turning Tides: 11th and 12th Centuries |
| Social Studies | Understanding Markets |

### Class 8th (28 chapters)

| Subject | Chapter |
|---|---|
| English | A Concrete Example |
| English | A Tale of Valour: Major Somnath Sharma and the Battle of Badgam |
| English | Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science |
| English | Feathered Friend |
| English | Harvest Hymn |
| English | Magnifying Glass |
| English | Somebody's Mother |
| English | Spectacular Wonders |
| English | The Case of the Fifth Word |
| English | The Cherry Tree |
| English | The Magic Brush of Dreams |
| English | The Wit that Won Hearts |
| English | Verghese Kurien – I Too Had a Dream |
| English | Waiting for the Rain |
| English | Wisdom Paves the Way |
| Hindi | आदमी का अनुपात |
| Hindi | एक आशीर्वाद |
| Hindi | एक टोकरी भर मिट्टी |
| Hindi | कबीर के दोहे |
| Hindi | दो गौरैया |
| Hindi | नए मेहमान |
| Hindi | मत बाँधो |
| Hindi | स्वदेश |
| Hindi | हरिद्वार |
| Mathematics | Algebra Play |
| Mathematics | Area |
| Mathematics | Exploring Some Geometric Themes |
| Mathematics | Fractions in Disguise |
| Mathematics | Proportional Reasoning-2 |
| Mathematics | Tales by Dots and Lines |
| Mathematics | The Baudhāyana-Pythagoras Theorem |
| Science | Electricity: Magnetic and Heating Effects |
| Science | Exploring the Investigative World of Science |
| Science | Health: The Ultimate Treasure |
| Science | Light: Mirrors and Lenses |
| Science | Nature of Matter: Elements, Compounds, and Mixtures |
| Science | Our Home: Earth, a Unique Life Sustaining Planet |
| Science | The Invisible Living World: Beyond Our Naked Eye |
| Social Studies | Reshaping India's Political Map |
| Social Studies | The Parliamentary System: Legislature and Executive |

### Class 9th (48 chapters)

| Subject | Chapter |
|---|---|
| English | The Little Girl |
| English | The Lost Child |
| English | The Snake and the Mirror |
| English | The Sound of Music |
| English | Weathering the Storm in Ersama |
| Hindi | chapter-1 kritika |
| Hindi | chapter-1 sparsh |
| Hindi | chapter-10 sparsh |
| Hindi | chapter-2 kritika |
| Hindi | chapter-2 sparsh |
| Hindi | chapter-3 kritika |
| Hindi | chapter-3 sparsh |
| Hindi | chapter-4 sparsh |
| Hindi | chapter-5 sparsh |
| Hindi | chapter-6 sparsh |
| Hindi | chapter-7 sparsh |
| Hindi | chapter-8 sparsh |
| Hindi | chapter-9 sparsh |
| Mathematics | CIRCLES |
| Mathematics | COORDINATE GEOMETRY |
| Mathematics | HERON'S FORMULA |
| Mathematics | INTRODUCTION TO EUCLID'S GEOMETRY |
| Mathematics | LINEAR EQUATIONS IN TWO VARIABLES |
| Mathematics | LINES AND ANGLES |
| Mathematics | NUMBER SYSTEMS |
| Mathematics | POLYNOMIALS |
| Mathematics | QUADRILATERALS |
| Mathematics | STATISTICS |
| Mathematics | SURFACE AREAS AND VOLUMES |
| Mathematics | TRIANGLES |
| Science | ATOMS AND MOLECULES |
| Science | FORCE AND LAWS OF MOTION |
| Science | GRAVITATION |
| Science | IMPROVEMENT IN FOOD RESOURCES |
| Science | IS MATTER AROUND US PURE? |
| Science | IS MATTER AROUND US PURE_ |
| Science | MATTER IN OUR SURROUNDINGS |
| Science | MOTION |
| Science | SOUND |
| Science | STRUCTURE OF THE ATOM |
| Science | THE FUNDAMENTAL UNIT OF LIFE |
| Science | TISSUES |
| Science | WORK AND ENERGY |
| Social Studies | Geography: Physical Features of India |
| Social Studies | Geography: Population |
| Social Studies | Hisotry: Forest Society and Colonialism |
| Social Studies | Hisotry: Nazism and the Rise of Hitler |
| Social Studies | Hisotry: Pastoralists in the Modern World |
| Social Studies | Hisotry: Socialism in Europe and the Russian Revolution |
| Social Studies | Hisotry: The French Revolution |
| Social Studies | Political Science: CONSTITUTIONAL DESIGN |
| Social Studies | Political Science: DEMOCRATIC RIGHTS |
| Social Studies | Political Science: ELECTORAL POLITICS |
| Social Studies | Political Science: WHAT IS DEMOCRACY? WHY DEMOCRACY? |

### Class 10th (2 chapters)

| Subject | Chapter |
|---|---|
| Science | 4. Carbon and its Compounds |
| Science | 8. Heredity |

### Class 11th (26 chapters)

| Subject | Chapter |
|---|---|
| Accountancy | keac101 |
| Accountancy | keac102 |
| Accountancy | keac103 |
| Accountancy | keac104 |
| Accountancy | keac105 |
| Accountancy | keac106 |
| Biology | Cell: The Unit of Life |
| Biology | Chemical Coordination and Integration |
| Biology | Locomotion and Movement |
| Biology | Neural Control and Coordination |
| Chemistry | Redox Reactions |
| Economics | Index Numbers |
| Economics | Non-Competitive Markets |
| English | A Photograph |
| English | Childhood |
| English | Discovering Tut: The Saga Continues |
| English | The Laburnum Top |
| English | The Voice of the Rain |
| English | We're Not Afraid to Die… if We Can All Be Together |
| Physics | Gravitation |

### Class 12th (21 chapters)

| Subject | Chapter |
|---|---|
| Accountancy | Accounting for Partnership: Basic Concepts |
| Accountancy | Accounting for Share Capital |
| Accountancy | Dissolution of Partnership Firm |
| Accountancy | Issue and Redemption of Debentures |
| Accountancy | Reconstitution of a Partnership Firm – Retirement/Death of a Partner |
| Biology | Biotechnology: Principles and Processes |
| Biology | Evolution |
| Biology | Human Reproduction |
| Biology | Microbes in Human Welfare |
| Biology | Principles of Inheritance and Variation |
| Biology | Sexual Reproduction in Flowering Plants |
| Business Studies | Planning |
| Economics | Employment: Growth, Informalisation and Other Issues |
| Economics | Liberalisation, Privatisation and Globalisation An Appraisal |
| Economics | Liberalisation, Privatisation and Globalisation: An Appraisal |
| English | Aunt Jennifer's Tigers |
| English | Keeping Quiet |
| English | My Mother at Sixty-Six |
| Physics | Electric Charges and Fields |
| Physics | Semiconductor Electronics: Materials, Devices and Simple Circuits |

---

## Part 2: MongoDB Chapters with NO Matching PDF in Data Set

These chapters exist in MongoDB but have **no corresponding PDF** in `~/Videos/Data set/`.

### Class 7th (10 chapters)

| Subject | Chapter |
|---|---|
| English | A Homage to Our Brave Soldiers |
| English | Conquering the Summit |
| English | My Brother's Great Invention |
| English | My Dear Soldiers |
| English | North, South, East, West |
| English | Paper Boats |
| English | Rani Abbakka |
| English | Say the Right Thing |
| English | The Tunnel |
| English | Travel |

### Class 8th (10 chapters)

| Subject | Chapter |
|---|---|
| English | Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science |
| English | Feathered Friend |
| English | Harvest Hymn |
| English | Magnifying Glass |
| English | Spectacular Wonders |
| English | The Case of the Fifth Word |
| English | The Cherry Tree |
| English | The Magic Brush of Dreams |
| English | Verghese Kurien – I Too Had a Dream |
| English | Waiting for the Rain |

### Class 9th (40 chapters)

| Subject | Chapter |
|---|---|
| English | A House Is Not a Home |
| English | A Truly Beautiful Mind |
| English | If I Were You |
| English | In the Kingdom of Fools |
| English | Iswaran the Storyteller |
| English | Kathmandu |
| English | My Childhood |
| English | Reach for the Top |
| English | The Adventures of Toto |
| English | The Beggar |
| English | The Fun They Had |
| English | The Happy Prince |
| English | The Last Leaf |
| English | The Little Girl |
| English | The Lost Child |
| English | The Snake and the Mirror |
| English | The Sound of Music |
| English | Weathering the Storm in Ersama |
| Hindi | chapter-1 kritika |
| Hindi | chapter-1 sparsh |
| Hindi | chapter-10 sparsh |
| Hindi | chapter-2 kritika |
| Hindi | chapter-2 sparsh |
| Hindi | chapter-3 kritika |
| Hindi | chapter-3 sparsh |
| Hindi | chapter-4 sparsh |
| Hindi | chapter-5 sparsh |
| Hindi | chapter-6 sparsh |
| Hindi | chapter-7 sparsh |
| Hindi | chapter-8 sparsh |
| Hindi | chapter-9 sparsh |
| Mathematics | CIRCLES |
| Mathematics | COORDINATE GEOMETRY |
| Mathematics | HERON'S FORMULA |
| Mathematics | INTRODUCTION TO EUCLID'S GEOMETRY |
| Mathematics | LINEAR EQUATIONS IN TWO VARIABLES |
| Mathematics | LINES AND ANGLES |
| Mathematics | NUMBER SYSTEMS |
| Mathematics | POLYNOMIALS |
| Mathematics | QUADRILATERALS |
| Mathematics | STATISTICS |
| Mathematics | SURFACE AREAS AND VOLUMES |
| Mathematics | TRIANGLES |
| Science | ATOMS AND MOLECULES |
| Science | FORCE AND LAWS OF MOTION |
| Science | GRAVITATION |
| Science | IMPROVEMENT IN FOOD RESOURCES |
| Science | IS MATTER AROUND US PURE? |
| Science | IS MATTER AROUND US PURE_ |
| Science | MATTER IN OUR SURROUNDINGS |
| Science | MOTION |
| Science | SOUND |
| Science | STRUCTURE OF THE ATOM |
| Science | THE FUNDAMENTAL UNIT OF LIFE |
| Science | TISSUES |
| Science | WORK AND ENERGY |
| Social Studies | Geography: Physical Features of India |
| Social Studies | Geography: Population |
| Social Studies | Hisotry: Forest Society and Colonialism |
| Social Studies | Hisotry: Nazism and the Rise of Hitler |
| Social Studies | Hisotry: Pastoralists in the Modern World |
| Social Studies | Hisotry: Socialism in Europe and the Russian Revolution |
| Social Studies | Hisotry: The French Revolution |
| Social Studies | Political Science: CONSTITUTIONAL DESIGN |
| Social Studies | Political Science: DEMOCRATIC RIGHTS |
| Social Studies | Political Science: ELECTORAL POLITICS |
| Social Studies | Political Science: WHAT IS DEMOCRACY? WHY DEMOCRACY? |

### Class 11th (6 chapters)

| Subject | Chapter |
|---|---|
| Biology | Chemical Coordination and Integration |
| Biology | Locomotion and Movement |
| Biology | Neural Control and Coordination |
| Chemistry | Redox Reactions |
| Economics | Non-Competitive Markets |
| English | A Photograph |
| English | Childhood |
| English | The Laburnum Top |
| English | The Voice of the Rain |
| Physics | Gravitation |

### Class 12th (6 chapters)

| Subject | Chapter |
|---|---|
| Accountancy | Accounting for Share Capital |
| Accountancy | Issue and Redemption of Debentures |
| English | Keeping Quiet |
| English | My Mother at Sixty-Six |
| Physics | Semiconductor Electronics: Materials, Devices and Simple Circuits |
