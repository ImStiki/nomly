import type { ImageTag } from './images';
import type { ItemTag, MenuItem, MenuSection, OptionGroup, Venue } from '@/types';
import { poolImage } from '@/lib/img';
import { seeded } from '@/lib/random';

/**
 * Menu templates. Each row is:
 * [name, description, price, imageTag | null, flags?, unit?]
 * flags: p = popular, v = vegetarian, vg = vegan, s = spicy, gf = gluten-free, n = new, a = 18+
 */
type Row = [string, string, number, ImageTag | null, string?, string?];
type OptKey = keyof typeof OPT;
type SectionTpl = [name: string, rows: Row[], opt?: OptKey, description?: string];

function group(id: string, name: string, min: number, max: number, choices: [string, number][]): OptionGroup {
  return {
    id,
    name,
    min,
    max,
    choices: choices.map(([n, price], i) => ({ id: `${id}-${i}`, name: n, price })),
  };
}

const OPT = {
  pizza: [
    group('size', 'Size', 1, 1, [['Regular 30 cm', 0], ['Large 40 cm', 4.5]]),
    group('extras', 'Extra toppings', 0, 5, [['Extra mozzarella', 1.5], ['Mushrooms', 1], ['Jalapeños', 1], ['Black olives', 1], ['Ham', 2], ['Pepperoni', 2], ['Rocket', 1]]),
  ],
  burger: [
    group('meal', 'Make it a meal', 1, 1, [['Just the burger', 0], ['Meal: fries + drink', 3.9], ['Meal: sweet potato fries + drink', 4.9]]),
    group('extras', 'Extras', 0, 4, [['Bacon', 1.5], ['Cheddar', 1], ['Avocado', 1.5], ['Fried egg', 1], ['Jalapeños', 0.8]]),
    group('remove', 'Leave out', 0, 4, [['No onion', 0], ['No pickles', 0], ['No tomato', 0], ['No sauce', 0]]),
  ],
  sushi: [group('extras', 'Extras', 0, 4, [['Extra wasabi', 0], ['Extra ginger', 0], ['Spicy mayo', 0.5], ['Eel sauce', 0.5], ['Low-sodium soy', 0]])],
  bowl: [
    group('base', 'Choose your base', 1, 1, [['Sushi rice', 0], ['Brown rice', 0], ['Quinoa', 1], ['Mixed greens', 0]]),
    group('extras', 'Add-ons', 0, 4, [['Avocado', 1.5], ['Edamame', 1], ['Extra protein', 3], ['Mango', 1], ['Crispy onion', 0.5]]),
  ],
  curry: [
    group('spice', 'Spice level', 1, 1, [['Mild', 0], ['Medium', 0], ['Hot', 0], ['Extra hot 🔥', 0]]),
    group('side', 'Sides', 0, 3, [['Basmati rice', 2.5], ['Garlic naan', 2.9], ['Butter naan', 2.5], ['Raita', 1.9]]),
  ],
  coffee: [
    group('size', 'Size', 1, 1, [['Small', 0], ['Medium', 0.6], ['Large', 1.1]]),
    group('milk', 'Milk', 0, 1, [['Oat milk', 0.5], ['Almond milk', 0.5], ['Lactose-free', 0.3]]),
    group('extras', 'Extras', 0, 3, [['Extra shot', 0.8], ['Vanilla syrup', 0.6], ['Caramel syrup', 0.6], ['Whipped cream', 0.5]]),
  ],
  boba: [
    group('size', 'Size', 1, 1, [['Regular 500 ml', 0], ['Large 700 ml', 1]]),
    group('sugar', 'Sugar level', 1, 1, [['0%', 0], ['30%', 0], ['50%', 0], ['100%', 0]]),
    group('ice', 'Ice', 1, 1, [['No ice', 0], ['Less ice', 0], ['Regular ice', 0]]),
    group('toppings', 'Toppings', 0, 3, [['Tapioca pearls', 0.8], ['Popping boba', 0.9], ['Lychee jelly', 0.8], ['Cheese foam', 1.2]]),
  ],
  wrap: [
    group('sauce', 'Sauce', 1, 1, [['Garlic', 0], ['Chili', 0], ['Yogurt & mint', 0], ['Tahini', 0]]),
    group('extras', 'Extras', 0, 3, [['Extra meat', 2.5], ['Feta', 1], ['Halloumi', 2], ['Fries inside', 1]]),
  ],
  chicken: [
    group('dip', 'Dips', 1, 2, [['BBQ', 0], ['Honey mustard', 0], ['Garlic mayo', 0], ['Buffalo hot', 0], ['Ranch', 0]]),
    group('heat', 'Heat', 1, 1, [['Classic', 0], ['Spicy', 0], ['Nashville hot 🔥', 0]]),
  ],
  steak: [
    group('doneness', 'Doneness', 1, 1, [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Well done', 0]]),
    group('side', 'Side', 1, 1, [['Fries', 0], ['Mashed potatoes', 0], ['Grilled vegetables', 0], ['Side salad', 0]]),
    group('sauce', 'Sauce', 0, 2, [['Pepper sauce', 1.5], ['Béarnaise', 1.5], ['Chimichurri', 1.5]]),
  ],
  tacos: [
    group('protein', 'Protein', 1, 1, [['Chicken tinga', 0], ['Carnitas', 0], ['Carne asada', 1.5], ['Grilled veggies', 0]]),
    group('extras', 'Extras', 0, 3, [['Guacamole', 1.5], ['Sour cream', 0.8], ['Pickled jalapeños', 0.5], ['Extra cheese', 1]]),
  ],
  pasta: [
    group('pasta', 'Pasta', 1, 1, [['Spaghetti', 0], ['Penne', 0], ['Tagliatelle', 0.5], ['Gluten-free penne', 1.5]]),
    group('extras', 'Extras', 0, 3, [['Parmesan', 1], ['Burrata', 3.5], ['Chili flakes', 0], ['Grilled chicken', 3]]),
  ],
  dessert: [group('topping', 'Topping', 0, 2, [['Chocolate sauce', 0.8], ['Caramel', 0.8], ['Fresh berries', 1.5], ['Whipped cream', 0.6]])],
  pancakes: [group('topping', 'Toppings', 0, 3, [['Maple syrup', 0], ['Hazelnut spread', 1], ['Fresh berries', 1.5], ['Crispy bacon', 2], ['Whipped cream', 0.6]])],
  smoothie: [
    group('size', 'Size', 1, 1, [['Regular', 0], ['Large', 1.5]]),
    group('boost', 'Boost', 0, 2, [['Protein', 1.2], ['Chia seeds', 0.6], ['Spirulina', 0.9], ['Ginger shot', 1]]),
  ],
  sandwich: [
    group('bread', 'Bread', 1, 1, [['Sourdough', 0], ['Ciabatta', 0], ['Rye', 0], ['Gluten-free', 1]]),
    group('extras', 'Extras', 0, 3, [['Avocado', 1.5], ['Bacon', 1.5], ['Extra cheese', 1], ['Egg', 1]]),
  ],
  hotdog: [group('toppings', 'Toppings', 0, 4, [['Crispy onions', 0], ['Pickles', 0], ['Jalapeños', 0.5], ['Cheese sauce', 1], ['Chili con carne', 1.5]])],
  noodle: [
    group('spice', 'Spice level', 1, 1, [['Not spicy', 0], ['Mild', 0], ['Spicy', 0], ['Thai hot 🔥', 0]]),
    group('protein', 'Extra protein', 0, 1, [['Chicken', 2.5], ['Tofu', 2], ['Shrimp', 3.5]]),
  ],
  ramen: [group('extras', 'Extras', 0, 4, [['Ajitama egg', 1.5], ['Extra chashu', 3], ['Extra noodles', 2], ['Nori', 0.5], ['Corn & butter', 1]])],
  icecream: [
    group('size', 'Size', 1, 1, [['1 scoop', 0], ['2 scoops', 2], ['3 scoops', 3.5]]),
    group('serve', 'Served in', 1, 1, [['Cup', 0], ['Waffle cone', 0.8]]),
  ],
  flowers: [
    group('card', 'Greeting card', 0, 1, [['Add a handwritten card', 2.5]]),
    group('wrap', 'Wrapping', 1, 1, [['Kraft paper', 0], ['Gift box', 4.9]]),
  ],
  drinkSize: [group('size', 'Size', 1, 1, [['0.33 l', 0], ['0.5 l', 0.8]])],
} satisfies Record<string, OptionGroup[]>;

const DRINKS: SectionTpl = [
  'Drinks',
  [
    ['Sparkling water', 'Lightly carbonated mineral water.', 2.5, 'water', '', '0.5 l'],
    ['Cola', 'Classic cola, ice cold.', 2.9, 'soda', '', '0.33 l'],
    ['Homemade lemonade', 'Fresh lemons, mint and a hint of ginger.', 3.9, 'smoothie', 'p vg'],
    ['Fresh orange juice', 'Squeezed to order.', 4.5, 'juice', 'vg'],
    ['Peach iced tea', 'Brewed in-house, lightly sweetened.', 3.2, null, 'vg'],
  ],
];

const SIDES: SectionTpl = [
  'Sides',
  [
    ['French fries', 'Crispy, salted, golden.', 3.9, 'fries', 'vg'],
    ['Sweet potato fries', 'With smoked paprika mayo.', 4.9, 'fries', 'v'],
    ['Onion rings', 'Beer-battered, with BBQ dip.', 4.5, null, 'v'],
    ['Coleslaw', 'Creamy cabbage and carrot slaw.', 2.9, 'salad', 'v'],
  ],
];

export const MENUS: Record<string, SectionTpl[]> = {
  pizza: [
    ['Pizzas', [
      ['Margherita', 'San Marzano tomato, fior di latte, basil, extra virgin olive oil.', 10.9, 'pizza', 'p v'],
      ['Pepperoni', 'Tomato, mozzarella, spicy pepperoni, oregano.', 12.9, 'pizza', 'p'],
      ['Quattro Formaggi', 'Mozzarella, gorgonzola, parmesan, fontina.', 13.5, 'pizza', 'v'],
      ['Diavola', 'Tomato, mozzarella, spicy salami, chili oil.', 13.2, 'pizza', 's'],
      ['Prosciutto e Rucola', 'Mozzarella, prosciutto crudo, rocket, parmesan shavings.', 14.5, 'pizza'],
      ['Funghi', 'Tomato, mozzarella, mixed mushrooms, thyme.', 12.2, 'pizza', 'v'],
      ['Capricciosa', 'Ham, mushrooms, artichokes, olives.', 13.9, 'pizza'],
      ['Vegana', 'Tomato, grilled vegetables, vegan cheese, basil.', 12.9, 'pizza', 'vg n'],
      ['Truffle Bianca', 'Cream, mozzarella, truffle paste, mushrooms.', 15.9, 'pizza', 'v n'],
    ], 'pizza', 'Wood-fired at 450°C for 90 seconds.'],
    ['Starters', [
      ['Garlic bread', 'Fresh dough, garlic butter, parsley.', 5.5, 'bread', 'v'],
      ['Burrata', 'Creamy burrata with cherry tomatoes and pesto.', 9.5, 'cheese', 'v p'],
      ['Arancini', 'Three crispy risotto balls with mozzarella.', 7.5, null, 'v'],
    ]],
    ['Desserts', [
      ['Tiramisu', 'Mascarpone, espresso, cocoa.', 6.5, 'dessert', 'v p'],
      ['Nutella pizza', 'Small dessert pizza with hazelnut spread.', 7.9, 'chocolate', 'v'],
    ]],
    DRINKS,
  ],
  burger: [
    ['Burgers', [
      ['Classic Cheeseburger', 'Smashed beef patty, cheddar, pickles, onion, house sauce.', 11.9, 'burger', 'p'],
      ['Double Trouble', 'Two smashed patties, double cheddar, bacon jam.', 15.5, 'burger', 'p'],
      ['Smoky BBQ', 'Beef, smoked cheddar, crispy onions, BBQ sauce.', 13.9, 'burger'],
      ['Crispy Chicken Burger', 'Buttermilk fried chicken, slaw, spicy mayo.', 12.9, 'burger', 's'],
      ['Truffle Mushroom', 'Beef, sautéed mushrooms, swiss cheese, truffle mayo.', 14.9, 'burger'],
      ['Green Machine', 'Plant-based patty, vegan cheese, avocado, tomato.', 13.5, 'burger', 'vg'],
      ['Kids Burger', 'Small beef patty, cheese, ketchup.', 7.9, 'burger'],
    ], 'burger', 'All burgers come on toasted brioche buns.'],
    SIDES,
    ['Shakes', [
      ['Vanilla shake', 'Thick and creamy with real vanilla.', 5.9, 'smoothie', 'v'],
      ['Chocolate shake', 'Belgian chocolate.', 5.9, 'smoothie', 'v p'],
      ['Salted caramel shake', 'With a pinch of sea salt.', 6.2, 'smoothie', 'v'],
    ]],
    DRINKS,
  ],
  sushi: [
    ['Sets', [
      ['Salmon Lover Set', '16 pcs: salmon nigiri, salmon maki, salmon avocado rolls.', 21.9, 'sushi', 'p'],
      ['Chef’s Mix (24 pcs)', 'Daily selection of nigiri, maki and specialty rolls.', 29.9, 'sushi', 'p'],
      ['Veggie Set', '18 pcs: avocado, cucumber, oshinko and inari.', 16.9, 'sushi', 'vg'],
    ], 'sushi'],
    ['Special rolls', [
      ['Dragon Roll', 'Tempura shrimp, cucumber, topped with eel and avocado.', 14.5, 'sushi', 'p'],
      ['Rainbow Roll', 'Crab, avocado, topped with tuna, salmon and prawn.', 15.5, 'sushi'],
      ['Spicy Tuna Roll', 'Tuna, spicy mayo, cucumber, sesame.', 12.9, 'sushi', 's'],
      ['Crispy Salmon Roll', 'Panko-fried roll with salmon, cream cheese, teriyaki.', 13.9, 'sushi', 'n'],
    ], 'sushi'],
    ['Nigiri & Sashimi', [
      ['Salmon nigiri (2 pcs)', 'Norwegian salmon on seasoned rice.', 5.5, 'sushi'],
      ['Tuna nigiri (2 pcs)', 'Yellowfin tuna.', 6.5, 'sushi'],
      ['Salmon sashimi (6 pcs)', 'Thick-cut fresh salmon.', 11.9, 'seafood', 'gf'],
    ]],
    ['Small dishes', [
      ['Edamame', 'With sea salt or chili garlic.', 4.9, null, 'vg'],
      ['Gyoza (5 pcs)', 'Pan-fried chicken dumplings, ponzu.', 6.9, 'dumplings'],
      ['Miso soup', 'Tofu, wakame, spring onion.', 3.9, 'pho', 'v'],
      ['Seaweed salad', 'Wakame, sesame dressing.', 5.5, 'salad', 'vg'],
    ]],
    DRINKS,
  ],
  kebab: [
    ['Kebabs & wraps', [
      ['Chicken kebab wrap', 'Marinated chicken, salad, pickles, garlic sauce in lavash.', 9.5, 'kebab', 'p'],
      ['Beef döner wrap', 'Slow-roasted beef, tomato, onion, chili sauce.', 10.5, 'kebab', 'p'],
      ['Falafel wrap', 'Crispy falafel, hummus, salad, tahini.', 8.9, 'falafel', 'vg'],
      ['Mixed kebab plate', 'Chicken and beef with rice, salad and bread.', 15.9, 'kebab'],
      ['Adana kebab', 'Spiced minced lamb skewer, grilled peppers, bulgur.', 16.5, 'kebab', 's'],
      ['Halloumi wrap', 'Grilled halloumi, tomato, cucumber, mint yogurt.', 9.9, 'kebab', 'v'],
    ], 'wrap'],
    ['Plates', [
      ['Kebab box with fries', 'Chicken or beef over fries with sauces.', 11.5, 'fries', 'p'],
      ['Iskender', 'Döner on pide bread, tomato butter, yogurt.', 16.9, 'kebab'],
    ]],
    ['Meze', [
      ['Hummus', 'Chickpeas, tahini, lemon, olive oil, warm bread.', 5.9, 'falafel', 'vg'],
      ['Baba ghanoush', 'Smoky aubergine dip.', 5.9, 'mediterranean', 'vg'],
      ['Baklava (4 pcs)', 'Pistachio baklava.', 5.5, 'dessert', 'v'],
    ]],
    DRINKS,
  ],
  mediterranean: [
    ['Bowls & plates', [
      ['Falafel plate', 'Six falafel, hummus, tabbouleh, pickles, pita.', 13.5, 'falafel', 'p vg'],
      ['Chicken shawarma plate', 'Rice, garlic toum, salad, pickled turnips.', 14.9, 'kebab', 'p'],
      ['Mezze platter for two', 'Hummus, moutabal, falafel, halloumi, olives, bread.', 24.9, 'mediterranean', 'v'],
      ['Grilled halloumi salad', 'Halloumi, watermelon, mint, pomegranate.', 12.9, 'salad', 'v gf'],
      ['Lamb kofta', 'Spiced lamb skewers, bulgur, yogurt.', 16.9, 'kebab'],
    ], 'wrap'],
    ['Dips', [
      ['Hummus beiruti', 'With parsley, garlic and chili.', 6.5, 'falafel', 'vg'],
      ['Muhammara', 'Roasted red pepper and walnut dip.', 6.5, 'mediterranean', 'vg s'],
      ['Labneh', 'Strained yogurt, za’atar, olive oil.', 5.9, null, 'v'],
    ]],
    ['Sweets', [['Baklava', 'Walnut and pistachio, four pieces.', 5.5, 'dessert', 'v']]],
    DRINKS,
  ],
  wok: [
    ['Wok dishes', [
      ['Kung Pao Chicken', 'Chicken, peanuts, dried chili, Sichuan pepper.', 13.9, 'noodles', 'p s'],
      ['Beef & Broccoli', 'Tender beef in oyster sauce, steamed rice.', 14.5, 'noodles'],
      ['Sweet & Sour Pork', 'Crispy pork, pineapple, peppers.', 13.5, 'noodles'],
      ['Mapo Tofu', 'Silken tofu, chili bean sauce, minced pork.', 12.5, 'noodles', 's'],
      ['Vegetable chow mein', 'Egg noodles, seasonal greens, soy.', 11.5, 'noodles', 'v p'],
      ['Egg fried rice', 'With peas, carrots and spring onion.', 8.9, 'thai', 'v'],
    ], 'noodle'],
    ['Dim sum', [
      ['Har gow (4 pcs)', 'Shrimp dumplings.', 6.9, 'dumplings', 'p'],
      ['Siu mai (4 pcs)', 'Pork and shrimp dumplings.', 6.5, 'dumplings'],
      ['Vegetable spring rolls', 'With sweet chili sauce.', 5.5, null, 'vg'],
    ]],
    DRINKS,
  ],
  dumplings: [
    ['Dumplings', [
      ['Pork & chive (10 pcs)', 'Hand-folded, boiled or pan-fried.', 11.9, 'dumplings', 'p'],
      ['Chicken & mushroom (10 pcs)', 'With shiitake and ginger.', 11.5, 'dumplings', 'p'],
      ['Spicy beef wontons (8 pcs)', 'In chili oil with black vinegar.', 12.5, 'dumplings', 's'],
      ['Vegetable (10 pcs)', 'Cabbage, carrot, glass noodles, tofu.', 10.5, 'dumplings', 'vg'],
      ['Xiao long bao (6 pcs)', 'Soup dumplings with pork.', 9.9, 'dumplings', 'n'],
    ]],
    ['Noodles & soups', [
      ['Dan dan noodles', 'Sesame, chili, minced pork.', 12.5, 'noodles', 's'],
      ['Wonton soup', 'Shrimp wontons in clear broth.', 9.5, 'pho'],
    ], 'noodle'],
    DRINKS,
  ],
  ramen: [
    ['Ramen', [
      ['Tonkotsu ramen', 'Rich pork bone broth, chashu, ajitama, nori, spring onion.', 15.5, 'ramen', 'p'],
      ['Spicy miso ramen', 'Miso broth, minced pork, chili oil, corn.', 15.9, 'ramen', 'p s'],
      ['Shoyu chicken ramen', 'Clear soy chicken broth, chicken chashu, bamboo.', 14.5, 'ramen'],
      ['Vegan tantanmen', 'Sesame soy milk broth, tofu, bok choy.', 14.5, 'ramen', 'vg'],
    ], 'ramen'],
    ['Small plates', [
      ['Karaage', 'Japanese fried chicken, kewpie mayo.', 7.5, 'chicken', 'p'],
      ['Takoyaki (6 pcs)', 'Octopus balls, bonito flakes.', 7.9, null],
      ['Gyoza (5 pcs)', 'Pork & cabbage.', 6.9, 'dumplings'],
    ]],
    DRINKS,
  ],
  thai: [
    ['Curries', [
      ['Green curry', 'Coconut milk, Thai basil, bamboo, aubergine. Served with jasmine rice.', 14.5, 'thai', 'p s'],
      ['Massaman curry', 'Beef, potato, peanuts, mild spices.', 15.5, 'thai'],
      ['Red curry with duck', 'Roasted duck, pineapple, grapes, lychee.', 17.5, 'thai', 's'],
    ], 'noodle'],
    ['Noodles & rice', [
      ['Pad Thai', 'Rice noodles, tamarind, egg, peanuts, lime.', 13.9, 'noodles', 'p'],
      ['Pad See Ew', 'Flat noodles, Chinese broccoli, dark soy.', 13.5, 'noodles'],
      ['Khao Pad', 'Thai fried rice with egg and cucumber.', 12.5, 'thai'],
    ], 'noodle'],
    ['Starters', [
      ['Tom Yum soup', 'Hot & sour soup with shrimp and lemongrass.', 8.5, 'pho', 's'],
      ['Chicken satay', 'Four skewers with peanut sauce.', 7.9, 'kebab'],
      ['Som Tam', 'Green papaya salad.', 7.5, 'salad', 'vg s'],
    ]],
    DRINKS,
  ],
  pho: [
    ['Phở & soups', [
      ['Phở bò', 'Beef broth simmered 12 hours, rice noodles, rare beef, herbs.', 14.5, 'pho', 'p'],
      ['Phở gà', 'Chicken broth, poached chicken, herbs.', 13.5, 'pho'],
      ['Bún bò Huế', 'Spicy lemongrass beef noodle soup.', 14.9, 'pho', 's'],
      ['Vegan phở', 'Mushroom broth, tofu, greens.', 12.9, 'pho', 'vg'],
    ], 'noodle'],
    ['Bánh mì & rolls', [
      ['Bánh mì thịt', 'Pork belly, pâté, pickles, coriander on baguette.', 9.5, 'sandwich', 'p'],
      ['Summer rolls (3 pcs)', 'Rice paper, shrimp, herbs, peanut sauce.', 7.5, null, 'gf'],
      ['Crispy spring rolls (4 pcs)', 'Pork and glass noodles.', 6.9, null],
    ]],
    DRINKS,
  ],
  korean: [
    ['Bowls', [
      ['Bibimbap', 'Rice, seasoned vegetables, beef bulgogi, fried egg, gochujang.', 14.5, 'poke', 'p'],
      ['Tofu bibimbap', 'With crispy tofu.', 13.5, 'poke', 'vg'],
      ['Spicy pork bowl', 'Jeyuk bokkeum over rice.', 14.9, 'thai', 's'],
    ], 'bowl'],
    ['Korean fried chicken', [
      ['Yangnyeom chicken', 'Double-fried, sweet & spicy glaze. 8 pcs.', 14.9, 'chicken', 'p s'],
      ['Soy garlic chicken', 'Double-fried, soy garlic glaze. 8 pcs.', 14.9, 'chicken'],
    ], 'chicken'],
    ['Sides', [
      ['Kimchi', 'House-fermented.', 3.5, 'salad', 'vg s'],
      ['Japchae', 'Glass noodles, vegetables, sesame.', 7.9, 'noodles', 'vg'],
      ['Tteokbokki', 'Spicy rice cakes, fish cake.', 8.5, null, 's'],
    ]],
    DRINKS,
  ],
  indian: [
    ['Curries', [
      ['Butter chicken', 'Tandoori chicken in a silky tomato, butter and cream sauce.', 15.5, 'curry', 'p'],
      ['Chicken tikka masala', 'Charred chicken tikka, spiced onion-tomato gravy.', 15.5, 'curry', 'p'],
      ['Lamb rogan josh', 'Slow-cooked Kashmiri lamb.', 17.5, 'curry', 's'],
      ['Palak paneer', 'Paneer in creamy spinach.', 13.9, 'curry', 'v'],
      ['Chana masala', 'Chickpeas in tangy tomato gravy.', 12.5, 'curry', 'vg'],
      ['Dal makhani', 'Black lentils simmered overnight.', 12.5, 'curry', 'v'],
      ['Chicken vindaloo', 'Goan-style, fiery.', 15.5, 'curry', 's'],
    ], 'curry'],
    ['Tandoor & biryani', [
      ['Chicken biryani', 'Fragrant basmati, saffron, fried onions, raita.', 16.5, 'curry', 'p'],
      ['Tandoori chicken (half)', 'Yogurt & spice marinated, charcoal-roasted.', 14.5, 'kebab'],
      ['Paneer tikka', 'Grilled cottage cheese, peppers, onion.', 12.9, 'kebab', 'v'],
    ]],
    ['Breads & sides', [
      ['Garlic naan', 'Baked in the tandoor.', 3.5, 'bread', 'v p'],
      ['Samosas (2 pcs)', 'Potato and pea, tamarind chutney.', 5.5, null, 'vg'],
      ['Onion bhaji', 'Crispy onion fritters.', 5.5, null, 'vg'],
    ]],
    ['Drinks', [
      ['Mango lassi', 'Yogurt, mango, cardamom.', 4.9, 'smoothie', 'v p'],
      ['Masala chai', 'Spiced milk tea.', 3.5, 'coffee', 'v'],
      ['Cola', 'Ice cold.', 2.9, 'soda'],
    ]],
  ],
  mexican: [
    ['Tacos', [
      ['Tacos al pastor (3)', 'Marinated pork, pineapple, onion, coriander.', 11.5, 'tacos', 'p'],
      ['Baja fish tacos (3)', 'Beer-battered fish, chipotle slaw, lime.', 12.5, 'tacos'],
      ['Birria tacos (3)', 'Slow-braised beef, cheese, consommé to dip.', 13.9, 'tacos', 'p n'],
      ['Veggie tacos (3)', 'Roasted cauliflower, black beans, salsa verde.', 10.5, 'tacos', 'vg'],
    ], 'tacos'],
    ['Burritos & bowls', [
      ['Classic burrito', 'Rice, black beans, cheese, pico de gallo, your choice of protein.', 12.9, 'burrito', 'p'],
      ['Burrito bowl', 'Everything from the burrito, no tortilla.', 12.9, 'poke', 'gf'],
      ['Quesadilla', 'Melted cheese, peppers, protein of choice.', 10.9, 'burrito'],
    ], 'tacos'],
    ['To share', [
      ['Nachos grande', 'Tortilla chips, cheese, jalapeños, guacamole, sour cream.', 11.5, 'chips', 'v'],
      ['Guacamole & chips', 'Made fresh every hour.', 6.9, 'avocado', 'vg'],
      ['Churros', 'With chocolate dip.', 5.9, 'dessert', 'v'],
    ]],
    DRINKS,
  ],
  chicken: [
    ['Fried chicken', [
      ['3 pc tenders', 'Buttermilk-brined tenders with one dip.', 8.9, 'chicken', 'p'],
      ['6 pc tenders', 'With two dips.', 14.5, 'chicken', 'p'],
      ['Bucket (8 pcs)', 'Mixed bone-in pieces, family size.', 22.9, 'chicken'],
      ['Hot wings (10 pcs)', 'Buffalo sauce, blue cheese dip.', 12.9, 'chicken', 's'],
      ['Chicken sandwich', 'Crispy thigh, pickles, slaw, brioche.', 11.5, 'sandwich'],
    ], 'chicken'],
    SIDES,
    DRINKS,
  ],
  healthy: [
    ['Salads', [
      ['Caesar salad', 'Romaine, grilled chicken, parmesan, sourdough croutons.', 12.9, 'salad', 'p'],
      ['Greek salad', 'Tomato, cucumber, olives, red onion, feta.', 11.5, 'salad', 'v gf'],
      ['Superfood salad', 'Kale, quinoa, roasted squash, pomegranate, seeds.', 13.5, 'salad', 'vg gf p'],
      ['Salmon & avocado', 'Baked salmon, avocado, greens, citrus dressing.', 15.9, 'salad', 'gf'],
    ]],
    ['Warm bowls', [
      ['Teriyaki chicken bowl', 'Brown rice, broccoli, edamame, sesame.', 13.9, 'poke', 'p'],
      ['Falafel buddha bowl', 'Hummus, falafel, roasted veg, tahini.', 12.9, 'vegan', 'vg'],
    ], 'bowl'],
    ['Smoothies', [
      ['Green detox', 'Spinach, apple, cucumber, ginger.', 6.5, 'smoothie', 'vg'],
      ['Berry blast', 'Mixed berries, banana, oat milk.', 6.5, 'smoothie', 'vg p'],
    ], 'smoothie'],
  ],
  poke: [
    ['Signature poke', [
      ['Classic salmon poke', 'Salmon, avocado, edamame, cucumber, sesame, shoyu.', 13.9, 'poke', 'p'],
      ['Spicy tuna poke', 'Tuna, mango, jalapeño, sriracha mayo.', 14.5, 'poke', 's p'],
      ['Teriyaki chicken poke', 'Chicken, corn, carrot, teriyaki.', 12.9, 'poke'],
      ['Tofu poke', 'Crispy tofu, seaweed salad, pickled ginger.', 11.9, 'poke', 'vg'],
      ['Shrimp tempura poke', 'Tempura shrimp, avocado, crispy onion.', 14.9, 'poke', 'n'],
    ], 'bowl'],
    ['Build your own', [['Build your own bowl', 'Choose base, protein and toppings.', 12.5, 'salad']], 'bowl'],
    DRINKS,
  ],
  breakfast: [
    ['All-day breakfast', [
      ['Full breakfast', 'Eggs, bacon, sausage, beans, mushrooms, toast.', 14.5, 'breakfast', 'p'],
      ['Eggs Benedict', 'Poached eggs, ham, hollandaise, English muffin.', 12.9, 'breakfast', 'p'],
      ['Avocado toast', 'Sourdough, smashed avocado, chili, feta, poached egg.', 11.5, 'avocado', 'v'],
      ['Shakshuka', 'Eggs baked in spiced tomato and peppers.', 11.9, 'breakfast', 'v s'],
      ['Granola bowl', 'Yogurt, honey, seasonal fruit.', 8.5, 'breakfast', 'v'],
    ]],
    ['Pancakes & waffles', [
      ['Buttermilk pancakes', 'Stack of three, butter and maple.', 9.5, 'pancakes', 'p v'],
      ['Belgian waffle', 'Crispy, with berries and cream.', 9.9, 'waffles', 'v'],
    ], 'pancakes'],
    ['Coffee', [
      ['Flat white', 'Double ristretto, silky milk.', 4.2, 'coffee'],
      ['Cappuccino', 'Classic.', 3.9, 'coffee', 'p'],
    ], 'coffee'],
  ],
  pancakes: [
    ['Pancakes', [
      ['Classic stack', 'Three fluffy pancakes, butter, maple syrup.', 8.9, 'pancakes', 'p v'],
      ['Blueberry pancakes', 'With blueberry compote and lemon cream.', 10.5, 'pancakes', 'p v'],
      ['Banana & caramel', 'Caramelised banana, salted caramel.', 10.9, 'pancakes', 'v'],
      ['Bacon & maple', 'Crispy bacon, maple syrup.', 11.5, 'pancakes'],
      ['Vegan pancakes', 'Oat milk batter, berries.', 10.5, 'pancakes', 'vg'],
    ], 'pancakes'],
    ['Waffles', [
      ['Liège waffle', 'Pearl sugar, caramelised crust.', 7.9, 'waffles', 'v'],
      ['Chicken & waffles', 'Fried chicken, hot honey.', 13.9, 'waffles', 'n'],
      ['Strawberry waffle', 'Fresh strawberries, whipped cream.', 9.5, 'waffles', 'v p'],
    ], 'pancakes'],
    ['Drinks', [
      ['Latte', 'Espresso and steamed milk.', 4.2, 'coffee'],
      ['Hot chocolate', 'With marshmallows.', 4.5, 'coffee', 'v'],
    ], 'coffee'],
  ],
  coffee: [
    ['Coffee', [
      ['Espresso', 'Single origin, rotating roast.', 2.9, 'coffee'],
      ['Cappuccino', 'Espresso, steamed milk, foam.', 3.9, 'coffee', 'p'],
      ['Caffè latte', 'Smooth and milky.', 4.2, 'coffee', 'p'],
      ['Flat white', 'Double ristretto.', 4.2, 'coffee'],
      ['Iced latte', 'Over ice.', 4.6, 'coffee'],
      ['Cold brew', 'Steeped 18 hours.', 4.5, 'coffee', 'vg'],
      ['Matcha latte', 'Ceremonial-grade matcha.', 4.9, 'coffee', 'n'],
      ['Chai latte', 'Spiced black tea and milk.', 4.5, 'coffee'],
    ], 'coffee'],
    ['Pastries', [
      ['Butter croissant', 'Flaky, all butter.', 3.2, 'croissant', 'v p'],
      ['Cinnamon bun', 'Cardamom and cinnamon.', 3.9, 'bakery', 'v p'],
      ['Banana bread', 'With walnuts.', 3.9, 'bakery', 'v'],
      ['Chocolate chip cookie', 'Chewy, sea salt.', 2.9, 'dessert', 'v'],
    ]],
    ['Breakfast', [
      ['Ham & cheese croissant', 'Toasted.', 6.5, 'croissant'],
      ['Overnight oats', 'Oat milk, chia, berries.', 5.9, 'breakfast', 'vg'],
    ]],
  ],
  bakery: [
    ['Fresh from the oven', [
      ['Sourdough loaf', '36-hour fermented, crackly crust.', 6.5, 'bread', 'vg p', '800 g'],
      ['Baguette', 'Classic French baguette.', 2.9, 'bread', 'vg', '250 g'],
      ['Rye bread', 'Dark, dense and nutty.', 5.5, 'bread', 'vg', '600 g'],
    ]],
    ['Pastries', [
      ['Butter croissant', 'Laminated with French butter.', 3.2, 'croissant', 'v p'],
      ['Pain au chocolat', 'Two bars of dark chocolate.', 3.6, 'croissant', 'v p'],
      ['Almond croissant', 'Frangipane, toasted almonds.', 4.2, 'croissant', 'v'],
      ['Cinnamon roll', 'Brown butter glaze.', 3.9, 'bakery', 'v'],
      ['Fruit tart', 'Vanilla custard, seasonal fruit.', 5.5, 'bakery', 'v'],
    ]],
    ['Cakes', [
      ['Chocolate cake slice', 'Three layers of dark chocolate.', 5.9, 'dessert', 'v'],
      ['Carrot cake slice', 'Cream cheese frosting.', 5.5, 'dessert', 'v'],
      ['Whole chocolate cake', 'Serves 8–10. Order 1 day ahead.', 42, 'dessert', 'v'],
    ]],
    ['Drinks', [['Filter coffee', 'Freshly brewed.', 2.9, 'coffee'], ['Cappuccino', 'Classic.', 3.9, 'coffee']], 'coffee'],
  ],
  dessert: [
    ['Cakes & treats', [
      ['Chocolate fudge cake', 'Warm, with vanilla ice cream.', 7.5, 'dessert', 'v p'],
      ['New York cheesecake', 'With berry compote.', 6.9, 'dessert', 'v p'],
      ['Macarons (6 pcs)', 'Assorted flavours.', 9.5, 'dessert', 'v gf'],
      ['Red velvet cupcake', 'Cream cheese frosting.', 4.5, 'dessert', 'v'],
      ['Brownie box (4)', 'Fudgy, with sea salt.', 9.9, 'chocolate', 'v'],
    ], 'dessert'],
    ['Donuts', [
      ['Glazed donut', 'Classic sugar glaze.', 2.9, 'donut', 'v'],
      ['Pink sprinkles donut', 'Strawberry icing.', 3.2, 'donut', 'v p'],
      ['Box of 6', 'Chef’s selection.', 15.9, 'donut', 'v'],
    ]],
    ['Ice cream', [
      ['Vanilla bean', 'Madagascar vanilla.', 4.5, 'icecream', 'v'],
      ['Double chocolate', 'With chocolate chunks.', 4.5, 'icecream', 'v'],
    ], 'icecream'],
  ],
  icecream: [
    ['Gelato', [
      ['Pistachio', 'Sicilian pistachio.', 4.5, 'icecream', 'v p'],
      ['Stracciatella', 'Milk gelato with chocolate shards.', 4.5, 'icecream', 'v p'],
      ['Strawberry sorbet', 'Fresh strawberries.', 4.5, 'icecream', 'vg'],
      ['Salted caramel', 'Rich and creamy.', 4.5, 'icecream', 'v'],
      ['Mango sorbet', 'Alphonso mango.', 4.5, 'icecream', 'vg'],
      ['Dark chocolate', '70% cocoa.', 4.5, 'icecream', 'vg'],
    ], 'icecream'],
    ['Take-home tubs', [
      ['Gelato tub 500 ml', 'Pick up to three flavours.', 11.9, 'icecream', 'v p', '500 ml'],
      ['Gelato tub 1 l', 'Pick up to four flavours.', 19.9, 'icecream', 'v', '1 l'],
    ]],
    ['Extras', [['Waffle with gelato', 'Warm waffle, scoop of choice.', 7.9, 'waffles', 'v']], 'dessert'],
  ],
  hotdog: [
    ['Hot dogs', [
      ['Classic dog', 'All-beef frank, mustard, ketchup, onions.', 6.9, 'hotdog', 'p'],
      ['Chili cheese dog', 'Beef chili, cheddar sauce.', 8.9, 'hotdog', 'p'],
      ['Bacon dog', 'Wrapped in bacon, BBQ, crispy onions.', 8.5, 'hotdog'],
      ['Veggie dog', 'Plant-based sausage, sauerkraut.', 7.5, 'hotdog', 'vg'],
    ], 'hotdog'],
    SIDES,
    DRINKS,
  ],
  bbq: [
    ['From the smoker', [
      ['Baby back ribs (half rack)', 'Slow-smoked 6 hours, house BBQ glaze.', 19.9, 'bbq', 'p'],
      ['Pulled pork sandwich', 'With slaw and pickles.', 13.5, 'sandwich', 'p'],
      ['Brisket plate', '250 g sliced brisket, two sides.', 22.5, 'steak'],
      ['Smoked chicken half', 'Dry rub, Alabama white sauce.', 16.9, 'bbq'],
    ]],
    ['Steaks', [
      ['Ribeye 300 g', 'Dry-aged 28 days.', 32.9, 'steak', 'p gf'],
      ['Sirloin 250 g', 'Grass-fed.', 26.9, 'steak', 'gf'],
    ], 'steak'],
    SIDES,
    DRINKS,
  ],
  italian: [
    ['Pasta', [
      ['Spaghetti carbonara', 'Guanciale, egg yolk, pecorino, black pepper.', 14.5, 'pasta', 'p'],
      ['Penne arrabbiata', 'Spicy tomato, garlic, parsley.', 11.9, 'pasta', 'vg s'],
      ['Tagliatelle al ragù', 'Slow-cooked beef & pork ragù.', 15.5, 'pasta', 'p'],
      ['Pesto Genovese', 'Basil, pine nuts, parmesan.', 12.9, 'pasta', 'v'],
      ['Lasagna', 'Layers of ragù, béchamel, parmesan.', 15.9, 'pasta'],
      ['Seafood linguine', 'Clams, mussels, prawns, cherry tomato.', 18.9, 'pasta', 'n'],
    ], 'pasta'],
    ['Antipasti', [
      ['Bruschetta', 'Tomato, garlic, basil on grilled bread.', 6.9, 'bread', 'vg'],
      ['Caprese', 'Buffalo mozzarella, tomato, basil.', 9.5, 'cheese', 'v gf'],
    ]],
    ['Dolci', [
      ['Tiramisu', 'Classic.', 6.9, 'dessert', 'v p'],
      ['Panna cotta', 'Vanilla, berry coulis.', 6.5, 'dessert', 'v gf'],
    ]],
    DRINKS,
  ],
  seafood: [
    ['Fish & chips', [
      ['Classic fish & chips', 'Beer-battered cod, chips, mushy peas, tartare.', 15.9, 'seafood', 'p'],
      ['Calamari & chips', 'Crispy squid rings, aioli.', 14.5, 'seafood'],
      ['Scampi basket', 'Breaded langoustine tails.', 16.5, 'seafood'],
    ]],
    ['From the sea', [
      ['Grilled salmon', 'With lemon butter, potatoes, greens.', 21.9, 'seafood', 'p gf'],
      ['Garlic prawns', 'Sizzling in olive oil, chili and garlic.', 13.9, 'seafood', 's'],
      ['Oysters (6 pcs)', 'Mignonette, lemon.', 18, 'seafood', 'gf'],
      ['Seafood platter for two', 'Prawns, mussels, calamari, salmon, fries.', 44, 'seafood', 'n'],
    ]],
    SIDES,
    DRINKS,
  ],
  boba: [
    ['Milk teas', [
      ['Classic milk tea', 'Black tea, milk, tapioca pearls.', 5.5, 'bubbletea', 'p'],
      ['Brown sugar boba', 'Tiger stripes, fresh milk.', 6.2, 'bubbletea', 'p'],
      ['Taro milk tea', 'Creamy and nutty.', 5.9, 'bubbletea'],
      ['Matcha latte boba', 'Uji matcha.', 6.2, 'bubbletea', 'n'],
      ['Thai milk tea', 'Spiced and sweet.', 5.9, 'bubbletea'],
    ], 'boba'],
    ['Fruit teas', [
      ['Passion fruit green tea', 'With popping boba.', 5.5, 'smoothie', 'vg'],
      ['Mango jasmine', 'Fresh mango.', 5.9, 'smoothie', 'vg p'],
      ['Lychee black tea', 'With lychee jelly.', 5.5, 'bubbletea', 'vg'],
    ], 'boba'],
  ],
  smoothie: [
    ['Smoothies', [
      ['Tropical sunrise', 'Mango, pineapple, passion fruit, coconut water.', 6.9, 'smoothie', 'vg p'],
      ['Berry blast', 'Strawberry, blueberry, banana, oat milk.', 6.9, 'smoothie', 'vg p'],
      ['Green goddess', 'Spinach, kale, apple, avocado, lime.', 7.2, 'smoothie', 'vg'],
      ['PB protein', 'Banana, peanut butter, cacao, protein.', 7.5, 'smoothie', 'v'],
    ], 'smoothie'],
    ['Fresh juices', [
      ['Orange', 'Freshly pressed.', 5.5, 'juice', 'vg'],
      ['Carrot, apple & ginger', 'Cold-pressed.', 5.9, 'juice', 'vg'],
      ['Ginger shot', 'Ginger, lemon, cayenne.', 3.5, 'juice', 'vg s'],
    ]],
    ['Bowls', [
      ['Açaí bowl', 'Açaí, granola, banana, berries, honey.', 9.9, 'breakfast', 'v p'],
      ['Pitaya bowl', 'Dragon fruit, coconut, kiwi.', 9.9, 'breakfast', 'vg'],
    ]],
  ],
  sandwich: [
    ['Sandwiches', [
      ['The Club', 'Chicken, bacon, egg, lettuce, tomato, mayo.', 10.9, 'sandwich', 'p'],
      ['Italian deli', 'Mortadella, salami, provolone, giardiniera.', 11.5, 'sandwich', 'p'],
      ['Tuna melt', 'Tuna, cheddar, red onion, grilled.', 9.9, 'sandwich'],
      ['Caprese', 'Mozzarella, tomato, pesto, rocket.', 9.5, 'sandwich', 'v'],
      ['Reuben', 'Pastrami, sauerkraut, swiss, Russian dressing.', 12.5, 'sandwich'],
      ['Falafel pita', 'Falafel, hummus, pickles.', 8.9, 'falafel', 'vg'],
    ], 'sandwich'],
    ['Sides & soups', [
      ['Tomato soup', 'Roasted tomato and basil.', 5.5, 'pho', 'vg'],
      ['Potato chips', 'Sea salt.', 2.5, 'chips', 'vg'],
    ]],
    DRINKS,
  ],
  vegan: [
    ['Mains', [
      ['Jackfruit burger', 'BBQ pulled jackfruit, slaw, vegan mayo.', 13.5, 'burger', 'vg p'],
      ['Buddha bowl', 'Quinoa, roasted veg, chickpeas, tahini.', 12.9, 'vegan', 'vg p'],
      ['Tofu katsu curry', 'Panko tofu, Japanese curry, rice.', 13.9, 'curry', 'vg'],
      ['Mushroom risotto', 'Arborio, porcini, truffle oil.', 14.5, 'pasta', 'vg gf'],
      ['Cauliflower wings', 'Buffalo sauce, ranch.', 8.9, 'vegan', 'vg s'],
    ]],
    ['Salads', [
      ['Rainbow salad', 'Beetroot, carrot, red cabbage, seeds.', 10.9, 'salad', 'vg gf'],
      ['Avocado toast', 'Sourdough, chili, lime.', 9.5, 'avocado', 'vg'],
    ]],
    ['Sweet', [['Raw chocolate cake', 'Cashew and cacao.', 6.5, 'dessert', 'vg gf']]],
    DRINKS,
  ],
  balkan: [
    ['From the grill', [
      ['Qebapa (10 pcs)', 'Grilled minced beef sausages, onion, somun bread, ajvar.', 9.9, 'kebab', 'p'],
      ['Pljeskavica', 'Large grilled patty with kajmak in lepinja.', 10.5, 'burger', 'p'],
      ['Mixed grill for two', 'Qebapa, chicken skewers, sausage, fries, salad.', 26.9, 'bbq'],
      ['Chicken skewers', 'Marinated, with grilled peppers.', 11.9, 'kebab'],
    ]],
    ['Traditional', [
      ['Flija', 'Layered crepe pie with kaymak. Pre-order.', 12.5, 'pancakes', 'v n'],
      ['Burek with meat', 'Flaky pastry, minced beef.', 4.5, 'bakery'],
      ['Burek with cheese', 'Flaky pastry, white cheese.', 4.2, 'bakery', 'v'],
      ['Tavë kosi', 'Baked lamb with yogurt.', 13.9, 'curry'],
    ]],
    ['Salads', [
      ['Shopska salad', 'Tomato, cucumber, pepper, onion, white cheese.', 5.5, 'salad', 'v gf'],
      ['Ajvar & bread', 'Roasted pepper relish.', 3.9, 'bread', 'vg'],
    ]],
    ['Drinks', [
      ['Ayran', 'Salty yogurt drink.', 2.2, 'milk', 'v'],
      ['Turkish coffee', 'Strong and sweet.', 1.8, 'coffee', 'vg'],
      ['Cola', 'Ice cold.', 2.5, 'soda'],
    ]],
  ],
  steakhouse: [
    ['Steaks', [
      ['Ribeye 300 g', 'Dry-aged 28 days, charcoal grilled.', 34.9, 'steak', 'p gf'],
      ['Tenderloin 220 g', 'The most tender cut.', 38.9, 'steak', 'gf'],
      ['T-bone 500 g', 'For the very hungry.', 42.9, 'steak'],
      ['Flank steak 250 g', 'Sliced, with chimichurri.', 24.9, 'steak', 'n'],
    ], 'steak'],
    ['Burgers', [['Wagyu burger', 'Wagyu beef, aged cheddar, onion jam.', 19.9, 'burger', 'p']], 'burger'],
    ['Starters', [
      ['Beef tartare', 'Hand-cut, capers, egg yolk.', 14.9, 'steak'],
      ['Caesar salad', 'Classic.', 9.9, 'salad'],
    ]],
    SIDES,
    DRINKS,
  ],

  /* ---------------- Stores ---------------- */
  grocery: [
    ['Offers', [
      ['Bananas', 'Fairtrade, from Ecuador.', 1.49, 'bananas', 'p vg', '1 kg'],
      ['Avocados ripe & ready', 'Pack of 2.', 2.49, 'avocado', 'p vg', '2 pcs'],
      ['Free-range eggs', 'Size M.', 2.99, 'eggs', 'p', '10 pcs'],
      ['Sparkling water 6-pack', 'Natural mineral water.', 3.49, 'water', '', '6 × 0.5 l'],
    ]],
    ['Fruits & vegetables', [
      ['Tomatoes on the vine', 'Sweet and juicy.', 2.99, 'produce', 'vg', '500 g'],
      ['Cucumber', 'Domestic.', 0.99, 'produce', 'vg', '1 pc'],
      ['Strawberries', 'Fresh punnet.', 3.99, 'produce', 'vg p', '400 g'],
      ['Apples Pink Lady', 'Crisp and sweet.', 2.79, 'produce', 'vg', '1 kg'],
      ['Baby spinach', 'Washed and ready to eat.', 1.99, 'produce', 'vg', '150 g'],
      ['Lemons', 'Unwaxed.', 1.49, 'produce', 'vg', '500 g'],
      ['Potatoes', 'All-round.', 1.79, 'produce', 'vg', '2 kg'],
      ['Avocado', 'Single, ripe.', 1.29, 'avocado', 'vg', '1 pc'],
    ]],
    ['Dairy & eggs', [
      ['Whole milk', '3.5% fat.', 1.39, 'milk', 'v p', '1 l'],
      ['Oat drink', 'Barista edition.', 2.19, 'milk', 'vg', '1 l'],
      ['Greek yogurt', '10% fat.', 2.49, 'milk', 'v', '500 g'],
      ['Butter', 'Salted.', 3.29, 'cheese', 'v', '250 g'],
      ['Mature cheddar', 'Aged 12 months.', 3.99, 'cheese', 'v', '300 g'],
      ['Mozzarella', 'Fresh, in brine.', 1.49, 'cheese', 'v', '125 g'],
      ['Eggs organic', 'Free-range.', 3.79, 'eggs', 'v', '6 pcs'],
    ]],
    ['Bread & bakery', [
      ['Sourdough bread', 'Baked this morning.', 3.99, 'bread', 'vg p', '600 g'],
      ['Toast bread', 'Sliced.', 1.69, 'bread', 'v', '500 g'],
      ['Croissants 4-pack', 'All butter.', 2.99, 'croissant', 'v', '4 pcs'],
    ]],
    ['Meat & fish', [
      ['Chicken breast fillets', 'Free-range.', 6.99, null, '', '500 g'],
      ['Minced beef', '10% fat.', 5.49, null, '', '400 g'],
      ['Salmon fillet', 'Norwegian, skin on.', 7.99, 'seafood', 'gf', '250 g'],
    ]],
    ['Pantry', [
      ['Spaghetti', 'Durum wheat.', 1.29, 'pasta', 'vg', '500 g'],
      ['Basmati rice', 'Long grain.', 2.49, null, 'vg', '1 kg'],
      ['Chopped tomatoes', 'Italian.', 0.99, null, 'vg', '400 g'],
      ['Extra virgin olive oil', 'Cold pressed.', 7.99, null, 'vg', '500 ml'],
      ['Peanut butter', 'Crunchy.', 3.49, null, 'vg', '350 g'],
    ]],
    ['Snacks & sweets', [
      ['Potato chips sea salt', 'Kettle cooked.', 2.29, 'chips', 'vg p', '150 g'],
      ['Dark chocolate 70%', 'Fairtrade.', 2.49, 'chocolate', 'vg', '100 g'],
      ['Milk chocolate', 'Creamy.', 1.99, 'chocolate', 'v', '100 g'],
      ['Mixed nuts', 'Roasted, salted.', 3.99, null, 'vg', '200 g'],
    ]],
    ['Drinks', [
      ['Cola 1.5 l', 'Classic.', 2.29, 'soda', '', '1.5 l'],
      ['Orange juice', 'Not from concentrate.', 2.99, 'juice', 'vg', '1 l'],
      ['Still water', 'Spring water.', 0.89, 'water', 'vg', '1.5 l'],
      ['Ground coffee', 'Medium roast.', 5.99, 'coffee', 'vg', '500 g'],
    ]],
    ['Frozen', [
      ['Vanilla ice cream', 'Real vanilla.', 4.49, 'icecream', 'v', '900 ml'],
      ['Frozen pizza margherita', 'Stone-baked.', 3.99, 'pizza', 'v', '350 g'],
      ['Frozen berries', 'Mixed.', 3.49, 'produce', 'vg', '500 g'],
    ]],
    ['Household', [
      ['Toilet paper', '3-ply.', 4.99, 'toiletpaper', '', '8 rolls'],
      ['Dish soap', 'Lemon.', 1.99, 'shampoo', '', '500 ml'],
      ['Kitchen towels', 'Extra absorbent.', 2.99, 'toiletpaper', '', '4 rolls'],
    ]],
  ],
  convenience: [
    ['Snacks', [
      ['Potato chips paprika', 'Crispy.', 2.49, 'chips', 'vg p', '175 g'],
      ['Chocolate bar', 'Milk chocolate with hazelnuts.', 1.49, 'chocolate', 'v p', '50 g'],
      ['Gummy bears', 'Fruity.', 1.99, null, '', '200 g'],
      ['Popcorn', 'Sweet & salty.', 2.29, 'chips', 'v', '90 g'],
    ]],
    ['Drinks', [
      ['Energy drink', 'Sugar free.', 1.99, 'soda', 'p', '0.5 l'],
      ['Cola can', 'Ice cold.', 1.49, 'soda', '', '0.33 l'],
      ['Iced coffee', 'Ready to drink.', 2.49, 'coffee', '', '250 ml'],
      ['Still water', 'Spring water.', 0.99, 'water', 'vg', '0.5 l'],
    ]],
    ['Ready meals', [
      ['Chicken wrap', 'Fresh today.', 4.99, 'sandwich', '', '1 pc'],
      ['Pasta salad', 'Pesto & mozzarella.', 4.49, 'pasta', 'v', '350 g'],
      ['Sushi box', '8 pcs.', 6.99, 'sushi', '', '8 pcs'],
    ]],
    ['Essentials', [
      ['Milk', '1.5%.', 1.29, 'milk', 'v', '1 l'],
      ['Toast bread', 'Sliced.', 1.79, 'bread', 'v', '500 g'],
      ['Toilet paper', '4-pack.', 2.99, 'toiletpaper', '', '4 rolls'],
      ['Phone charger USB-C', 'Fast charging cable.', 9.99, 'headphones', '', '1 m'],
    ]],
  ],
  organic: [
    ['Organic produce', [
      ['Organic bananas', 'Fairtrade.', 1.99, 'bananas', 'vg p', '1 kg'],
      ['Organic carrots', 'Local farm.', 1.49, 'produce', 'vg', '1 kg'],
      ['Organic avocados', 'Pack of 2.', 3.49, 'avocado', 'vg', '2 pcs'],
      ['Seasonal veggie box', 'Farmer’s pick of the week.', 19.9, 'produce', 'vg p', '≈ 5 kg'],
    ]],
    ['Dairy & alternatives', [
      ['Organic milk', 'Whole.', 1.89, 'milk', 'v', '1 l'],
      ['Organic eggs', 'Pasture-raised.', 4.29, 'eggs', 'v p', '6 pcs'],
      ['Almond drink', 'Unsweetened.', 2.79, 'milk', 'vg', '1 l'],
    ]],
    ['Bakery', [['Spelt sourdough', 'Stone-ground spelt.', 4.99, 'bread', 'vg', '700 g']]],
    ['Pantry', [
      ['Organic oats', 'Rolled.', 2.29, 'breakfast', 'vg', '1 kg'],
      ['Raw honey', 'Wildflower.', 8.99, null, 'v', '350 g'],
      ['Organic dark chocolate', '85%.', 3.49, 'chocolate', 'vg', '100 g'],
    ]],
  ],
  pharmacy: [
    ['Pain & fever', [
      ['Ibuprofen 400 mg', 'For pain and fever. Read the leaflet before use.', 4.99, 'vitamins', 'p', '20 tablets'],
      ['Paracetamol 500 mg', 'Pain relief.', 3.49, 'vitamins', 'p', '30 tablets'],
      ['Throat lozenges', 'Honey & lemon.', 5.49, 'vitamins', '', '24 pcs'],
    ]],
    ['Vitamins', [
      ['Vitamin D3 2000 IU', 'Daily supplement.', 8.99, 'vitamins', 'p', '90 caps'],
      ['Vitamin C effervescent', 'Orange flavour.', 4.49, 'vitamins', '', '20 tablets'],
      ['Magnesium', 'With B6.', 9.99, 'vitamins', '', '60 tablets'],
      ['Omega-3', 'Fish oil.', 12.99, 'vitamins', '', '60 caps'],
    ]],
    ['Personal care', [
      ['Shampoo', 'For all hair types.', 4.99, 'shampoo', '', '250 ml'],
      ['Body lotion', 'Sensitive skin.', 6.49, 'shampoo', '', '400 ml'],
      ['Sunscreen SPF 50', 'Water resistant.', 14.99, 'shampoo', 'n', '200 ml'],
      ['Toothpaste', 'Whitening.', 2.99, 'shampoo', '', '75 ml'],
      ['Hand sanitizer', '70% alcohol.', 3.49, 'shampoo', '', '100 ml'],
    ]],
    ['First aid', [
      ['Plasters assorted', 'Waterproof.', 3.99, 'pharmacy', '', '40 pcs'],
      ['Digital thermometer', 'Fast 10-second reading.', 9.99, 'pharmacy', '', '1 pc'],
    ]],
  ],
  flowers: [
    ['Bouquets', [
      ['Classic red roses', 'Twelve long-stem red roses.', 39.9, 'flowers', 'p', '12 stems'],
      ['Spring mix', 'Tulips, ranunculus and eucalyptus.', 34.9, 'flowers', 'p'],
      ['Pastel dream', 'Pink roses, carnations and gypsophila.', 32.9, 'flowers'],
      ['Sunflower joy', 'Bright sunflowers with greenery.', 29.9, 'flowers', 'n'],
      ['Wildflower bunch', 'Seasonal, rustic, wrapped in kraft paper.', 24.9, 'flowers'],
      ['Grand bouquet', 'Our biggest seasonal arrangement.', 69.9, 'flowers'],
    ], 'flowers'],
    ['Add a little extra', [
      ['Chocolate box', 'Assorted pralines.', 12.9, 'chocolate', 'v'],
      ['Scented candle', 'Fig & cedar.', 18.9, null],
      ['Greeting card', 'Blank inside.', 3.5, null],
    ]],
  ],
  electronics: [
    ['Audio', [
      ['Wireless earbuds', 'Noise cancelling, 24 h battery with case.', 79.9, 'headphones', 'p'],
      ['Over-ear headphones', 'Bluetooth 5.3, 40 h battery.', 129, 'headphones', 'p'],
      ['Portable speaker', 'Waterproof, 12 h.', 49.9, 'headphones'],
    ]],
    ['Charging', [
      ['USB-C cable 2 m', 'Braided, 100 W.', 14.9, 'headphones', 'p'],
      ['Power bank 10 000 mAh', 'Fast charge.', 29.9, 'headphones'],
      ['Wall charger 30 W', 'USB-C PD.', 24.9, 'headphones'],
    ]],
    ['Accessories', [
      ['Phone case', 'Clear, shockproof.', 19.9, null],
      ['Screen protector', 'Tempered glass, 2-pack.', 12.9, null],
      ['AA batteries', 'Alkaline 8-pack.', 7.9, null, '', '8 pcs'],
    ]],
  ],
  pets: [
    ['Dogs', [
      ['Dry dog food adult', 'Chicken & rice.', 24.9, 'petfood', 'p', '3 kg'],
      ['Dog treats', 'Bone-shaped biscuits.', 4.99, 'petfood', 'p', '400 g'],
      ['Chew toy', 'Durable rubber.', 9.9, 'petfood'],
    ]],
    ['Cats', [
      ['Wet cat food', 'Salmon in jelly, 12-pack.', 11.9, 'petfood', 'p', '12 × 85 g'],
      ['Cat litter', 'Clumping, unscented.', 8.9, null, '', '10 l'],
      ['Cat treats', 'Crunchy.', 3.49, 'petfood', '', '60 g'],
    ]],
  ],
  alcohol: [
    ['Wine', [
      ['House red', 'Medium-bodied, cherry & spice.', 9.9, 'wine', 'a p', '0.75 l'],
      ['Sauvignon blanc', 'Crisp, citrus.', 11.9, 'wine', 'a p', '0.75 l'],
      ['Rosé', 'Dry, Provence style.', 12.9, 'wine', 'a', '0.75 l'],
      ['Prosecco', 'Extra dry.', 13.9, 'wine', 'a', '0.75 l'],
    ]],
    ['Beer & cider', [
      ['Lager 6-pack', 'Crisp pilsner.', 8.9, 'soda', 'a', '6 × 0.33 l'],
      ['IPA', 'Hoppy, citrus.', 3.4, 'soda', 'a n', '0.33 l'],
      ['Apple cider', 'Dry.', 3.2, 'juice', 'a', '0.33 l'],
    ]],
    ['Alcohol-free', [
      ['Alcohol-free sparkling', 'Dealcoholised wine.', 7.9, 'wine', '', '0.75 l'],
      ['Alcohol-free lager', '0.0%.', 1.9, 'soda', '', '0.33 l'],
    ]],
  ],
};

const FLAG_TAGS: Record<string, ItemTag> = {
  v: 'vegetarian',
  vg: 'vegan',
  s: 'spicy',
  gf: 'gluten-free',
  n: 'new',
  a: 'age-18',
};

const cache = new Map<string, MenuSection[]>();

/** Build the full menu for a venue, applying venue-specific promos and price variance. */
export function getMenu(venue: Venue): MenuSection[] {
  const cached = cache.get(venue.id);
  if (cached) return cached;
  const tpl = MENUS[venue.menuKey] ?? MENUS.burger;
  const rnd = seeded(`menu-${venue.id}`);
  const priceFactor = venue.priceLevel === 1 ? 0.88 : venue.priceLevel === 3 ? 1.18 : 1;
  const discount = venue.promo?.kind === 'discount';

  const sections: MenuSection[] = tpl.map(([name, rows, optKey, description], si) => ({
    id: `${venue.id}-s${si}`,
    name,
    description,
    items: rows.map(([itemName, desc, price, tag, flags = '', unit], ii): MenuItem => {
      const flagList = flags.split(/\s+/).filter(Boolean);
      const tags = flagList.map((f) => FLAG_TAGS[f]).filter(Boolean) as ItemTag[];
      const isStore = venue.type === 'store';
      const p = isStore ? price : Math.round(price * priceFactor * 10) / 10;
      const finalPrice = Math.max(0.5, Math.round(p * 100) / 100);
      const onSale = discount && (flagList.includes('p') || rnd.chance(0.25));
      const item: MenuItem = {
        id: `${venue.id}-s${si}-i${ii}`,
        name: itemName,
        description: desc,
        price: onSale ? Math.round(finalPrice * 0.8 * 100) / 100 : finalPrice,
        originalPrice: onSale ? finalPrice : undefined,
        image: tag ? poolImage(tag, `${venue.id}-${itemName}`) : undefined,
        popular: flagList.includes('p'),
        tags: tags.length ? tags : undefined,
        options: optKey ? OPT[optKey] : undefined,
        unit,
      };
      return item;
    }),
  }));

  const popular = sections.flatMap((s) => s.items).filter((i) => i.popular).slice(0, 6);
  const result = popular.length >= 3
    ? [{ id: `${venue.id}-popular`, name: venue.type === 'store' ? 'Best sellers' : 'Most ordered', items: popular }, ...sections]
    : sections;
  cache.set(venue.id, result);
  return result;
}

export function findMenuItem(venue: Venue, itemId: string): MenuItem | undefined {
  for (const s of getMenu(venue)) {
    const it = s.items.find((i) => i.id === itemId);
    if (it) return it;
  }
  return undefined;
}
