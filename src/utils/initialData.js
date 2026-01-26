export const INITIAL_DATA = {
    categories: [
        { name: "🧺 GROCERY & STAPLES (راشن / کریانہ)" },
        { name: "🛢️ OILS & FATS (تیل و گھی)" },
        { name: "🌶️ SPICES & MASALAY (مصالحہ جات)" },
        { name: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)" },
        { name: "🍝 PACKAGED FOOD (پیک شدہ خوراک)" },
        { name: "☕ BEVERAGES (مشروبات)" },
        { name: "🧼 PERSONAL CARE (ذاتی استعمال)" },
        { name: "🧹 HOME CLEANING (صفائی کا سامان)" },
        { name: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)" },
        { name: "🥜 DRY ITEMS (خشک اشیاء)" },
        { name: "🧂 BAKING & KITCHEN USE" },
        { name: "🔧 MISC / DAILY NEEDS" }
    ],
    items: [
        // GROCERY & STAPLES
        { name: "Fine Flour (Maida) / میدہ", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Gram Flour (Besan) / بیسن", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Rice / چاول", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Lentils (All Types) / دالیں", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Chickpeas / چنے", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Kidney Beans / لوبیا", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Barley / جو", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Millet / باجرہ", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Corn Flour / مکئی کا آٹا", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Sugar / چینی", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Brown Sugar / براؤن شوگر", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Jaggery / گڑ", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'kg', price: 0 },
        { name: "Salt / نمک", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'packet', price: 0 },
        { name: "Pink Salt / سینڈھا نمک", category: "🧺 GROCERY & STAPLES (راشن / کریانہ)", unitType: 'packet', price: 0 },

        // OILS & FATS
        { name: "Cooking Oil / کھانے کا تیل", category: "🛢️ OILS & FATS (تیل و گھی)", unitType: 'packet', price: 0 },
        { name: "Mustard Oil / سرسوں کا تیل", category: "🛢️ OILS & FATS (تیل و گھی)", unitType: 'kg', price: 0 },
        { name: "Sunflower Oil / سورج مکھی کا تیل", category: "🛢️ OILS & FATS (تیل و گھی)", unitType: 'packet', price: 0 },
        { name: "Ghee / گھی", category: "🛢️ OILS & FATS (تیل و گھی)", unitType: 'packet', price: 0 },
        { name: "Butter / مکھن", category: "🛢️ OILS & FATS (تیل و گھی)", unitType: 'piece', price: 0 },

        // SPICES & MASALAY
        { name: "Red Chili Powder / لال مرچ پاؤڈر", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Turmeric Powder / ہلدی", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Coriander Powder / دھنیا پاؤڈر", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Cumin Seeds / زیرہ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Black Pepper / کالی مرچ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "White Pepper / سفید مرچ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Garam Masala / گرم مصالحہ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Cinnamon / دار چینی", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Cloves / لونگ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Cardamom / الائچی", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Bay Leaf / تیز پات", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Carom Seeds / اجوائن", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Mustard Seeds / سرسوں", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Nigella Seeds / کلونجی", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Fenugreek Seeds / میتھی", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },
        { name: "Dried Green Chili / خشک ہری مرچ", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'kg', price: 0 },
        { name: "Ready Masala Mix / مصالحہ مکس", category: "🌶️ SPICES & MASALAY (مصالحہ جات)", unitType: 'packet', price: 0 },

        // SWEET & CONDIMENTS
        { name: "Honey / شہد", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Tomato Ketchup / کیچپ", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Chili Sauce / چلی ساس", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Soy Sauce / سویا ساس", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Vinegar / سرکہ", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Pickles / اچار", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'packet', price: 0 },
        { name: "Jam / جام", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },
        { name: "Chocolate Spread / چاکلیٹ اسپریڈ", category: "🍯 SWEET & CONDIMENTS (چٹنیاں و میٹھا)", unitType: 'piece', price: 0 },

        // PACKAGED FOOD
        { name: "Biscuits / بسکٹ", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },
        { name: "Noodles / نوڈلز", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },
        { name: "Spaghetti / سپاگٹی", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },
        { name: "Vermicelli / سیویاں", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },
        { name: "Soup Packets / سوپ پیکٹ", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },
        { name: "Cornflakes / کارن فلیکس", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'box', price: 0 },
        { name: "Oats / جئی", category: "🍝 PACKAGED FOOD (پیک شدہ خوراک)", unitType: 'packet', price: 0 },

        // BEVERAGES
        { name: "Tea / چائے", category: "☕ BEVERAGES (مشروبات)", unitType: 'packet', price: 0 },
        { name: "Green Tea / سبز چائے", category: "☕ BEVERAGES (مشروبات)", unitType: 'packet', price: 0 },
        { name: "Coffee / کافی", category: "☕ BEVERAGES (مشروبات)", unitType: 'piece', price: 0 },
        { name: "Milk Powder / دودھ پاؤڈر", category: "☕ BEVERAGES (مشروبات)", unitType: 'packet', price: 0 },
        { name: "Juice Packets / جوس", category: "☕ BEVERAGES (مشروبات)", unitType: 'piece', price: 0 },
        { name: "Soft Drinks / سافٹ ڈرنکس", category: "☕ BEVERAGES (مشروبات)", unitType: 'piece', price: 0 },

        // PERSONAL CARE
        { name: "Soap / صابن", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Shampoo / شیمپو", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Hair Oil / ہیئر آئل", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Toothpaste / ٹوتھ پیسٹ", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Toothbrush / ٹوتھ برش", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Shaving Cream / شیو کریم", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Razor / استرا", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },
        { name: "Face Wash / فیس واش", category: "🧼 PERSONAL CARE (ذاتی استعمال)", unitType: 'piece', price: 0 },

        // HOME CLEANING
        { name: "Washing Powder / واشنگ پاؤڈر", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'packet', price: 0 },
        { name: "Liquid Detergent / لیکوئڈ ڈیٹرجنٹ", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },
        { name: "Dish Wash / ڈش واش", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },
        { name: "Phenyl / فینائل", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },
        { name: "Bleach / بلیچ", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },
        { name: "Toilet Cleaner / ٹوائلٹ کلینر", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },
        { name: "Floor Cleaner / فرش کلینر", category: "🧹 HOME CLEANING (صفائی کا سامان)", unitType: 'piece', price: 0 },

        // HOUSEHOLD ITEMS
        { name: "Broom / جھاڑو", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'piece', price: 0 },
        { name: "Mop / پونچھا", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'piece', price: 0 },
        { name: "Garbage Bags / کچرا بیگ", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'packet', price: 0 },
        { name: "Sponges / اسپنج", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'piece', price: 0 },
        { name: "Scrub Pads / اسکاچ برائٹ", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'piece', price: 0 },
        { name: "Matchbox / ماچس", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'packet', price: 0 },
        { name: "Candles / موم بتی", category: "🧽 HOUSEHOLD ITEMS (گھریلو اشیاء)", unitType: 'packet', price: 0 },

        // DRY ITEMS
        { name: "Dry Nuts / خشک میوہ جات", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'packet', price: 0 },
        { name: "Almonds / بادام", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'kg', price: 0 },
        { name: "Cashews / کاجو", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'kg', price: 0 },
        { name: "Raisins / کشمش", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'kg', price: 0 },
        { name: "Dates / کھجور", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'kg', price: 0 },
        { name: "Peanuts / مونگ پھلی", category: "🥜 DRY ITEMS (خشک اشیاء)", unitType: 'kg', price: 0 },

        // BAKING & KITCHEN USE
        { name: "Baking Powder / بیکنگ پاؤڈر", category: "🧂 BAKING & KITCHEN USE", unitType: 'packet', price: 0 },
        { name: "Baking Soda / بیکنگ سوڈا", category: "🧂 BAKING & KITCHEN USE", unitType: 'packet', price: 0 },
        { name: "Yeast / خمیر", category: "🧂 BAKING & KITCHEN USE", unitType: 'packet', price: 0 },
        { name: "Custard Powder / کسٹرڈ پاؤڈر", category: "🧂 BAKING & KITCHEN USE", unitType: 'packet', price: 0 },

        // MISC / DAILY NEEDS
        { name: "Plastic Bags / پلاسٹک بیگ", category: "🔧 MISC / DAILY NEEDS", unitType: 'packet', price: 0 },
        { name: "Aluminum Foil / ایلومینیم فوائل", category: "🔧 MISC / DAILY NEEDS", unitType: 'piece', price: 0 },
        { name: "Cling Film / کلنگ فلم", category: "🔧 MISC / DAILY NEEDS", unitType: 'piece', price: 0 },
        { name: "Paper Towels / ٹشو پیپر", category: "🔧 MISC / DAILY NEEDS", unitType: 'packet', price: 0 },
        { name: "Napkins / نیپکن", category: "🔧 MISC / DAILY NEEDS", unitType: 'packet', price: 0 },
    ]
};
