-- Migration: Add Miscelánea Category & Christmas Cushion Products (La Tiendita Navideña)
INSERT INTO public.products (
  id, name, category, subcategory, unit, base_cost,
  price_retail, price_micro, price_restaurant,
  previous_price_retail, previous_price_micro, previous_price_restaurant,
  stock_quantity, is_active, is_in_season, image_url, description
) VALUES
(
  'prd_nav_01', 'Cojín Navideño Sagrada Familia Pesebre', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  45, true, true, '/IMAGES/navidad/cojin-sagrada-familia-pesebre.jpg',
  'Cojín decorativo premium con ilustración artística de la Sagrada Familia (San José, la Virgen María y el Niño Jesús en el pesebre de Belén). Confección en tela terciopelo suave al tacto con relleno siliconado antialérgico y cremallera invisible.'
),
(
  'prd_nav_02', 'Cojín Navideño Pesebre con Ángeles de Gloria', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  38, true, true, '/IMAGES/navidad/cojin-pesebre-angeles-gloria.jpg',
  'Elegante cojín navideño que representa el Nacimiento con ángeles dorados, guirnalda iluminada y mensaje Merry Christmas. Acabado de lujo para engalanar la sala familiar durante las novenas.'
),
(
  'prd_nav_03', 'Cojín Navideño Santa Noel con Saco de Regalos', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  50, true, true, '/IMAGES/navidad/cojin-santa-saco-regalos.jpg',
  'Papá Noel clásico en estilo vintage tierno con su saco desbordante de regalos y lazo rojo. Impresión textil de alta fidelidad que no pierde color con los lavados.'
),
(
  'prd_nav_04', 'Cojín Navideño Papá Noel Sonriente y Bastón de Caramelo', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  42, true, true, '/IMAGES/navidad/cojin-santa-baston-caramelo.jpg',
  'Santa Claus tradicional con su traje rojo terciopelo, bastón de dulce y expresión acogedora. Dale a tu sofá o sillón favorito un aire festivo y alegre.'
),
(
  'prd_nav_05', 'Cojín Navideño Santa y Reno en Bosque Nevado', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  36, true, true, '/IMAGES/navidad/cojin-santa-reno-bosque.jpg',
  'Tierna escena invernal de Papá Noel acariciando a su fiel reno Rodolfo en un bosque de pinos nevados. Colores vivos y tacto ultrasuave.'
),
(
  'prd_nav_06', 'Cojín Navideño Santa con Farol Dorado Iluminado', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  40, true, true, '/IMAGES/navidad/cojin-santa-farol-dorado.jpg',
  'Ilustración nocturna de Santa alumbrando el camino con un farol dorado en Nochebuena. Transmite calidez, magia y luz en tu decoración navideña.'
),
(
  'prd_nav_07', 'Cojín Navideño Santa y Reno Amor Navideño', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  34, true, true, '/IMAGES/navidad/cojin-santa-reno-amor.jpg',
  'Primer plano conmovedor de Santa abrazando a su reno con fondo nevado. Perfecto para regalar a seres queridos o decorar la cama de los niños.'
),
(
  'prd_nav_08', 'Cojín Navideño Muñeco de Nieve con Bufanda y Reno Tierno', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  48, true, true, '/IMAGES/navidad/cojin-muneco-nieve-reno.jpg',
  'Amistoso muñeco de nieve con sombrero de copa y bufanda roja junto a un pequeño reno juguetón. Ideal para espacios luminosos y modernos.'
),
(
  'prd_nav_09', 'Cojín Navideño Osito Tierno con Farol y Pijama', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  44, true, true, '/IMAGES/navidad/cojin-oso-farol-pijama.jpg',
  'Cachorro de oso polar en pijama navideña roja llevando un farol de luz tenue en la nieve. Dulzura absoluta para alcobas y salas familiares.'
),
(
  'prd_nav_10', 'Cojín Navideño Osito Tierno con Bola de Cristal de Nieve', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  35, true, true, '/IMAGES/navidad/cojin-oso-esfera-nieve.jpg',
  'Bello osito abrigado sosteniendo una mágica bola de cristal nevada. Trae tranquilidad, paz y armonía al hogar santandereano.'
),
(
  'prd_nav_11', 'Cojín Navideño Duendecillos en el Taller de Santa', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 25000,
  40000, 36000, 35000, 50000, 45000, 42000,
  30, true, true, '/IMAGES/navidad/cojin-duendecillos-taller.jpg',
  'Elfos navideños niño y niña con coronita y traje verde y rojo preparando cartas y regalos de Navidad junto al árbol brillante. Lleno de detalles y vivacidad.'
),
(
  'prd_nav_combo4', 'Combo Navideño x4 Cojines Familiares a Elección', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Set x4 Cojines 45x45 cm', 90000,
  139900, 130000, 125000, 200000, 180000, 170000,
  25, true, true, '/IMAGES/navidad/cojin-santa-reno-amor.jpg',
  '¡El mejor combo para renovar toda tu sala! Elige 4 diseños de cojines de la colección La Tiendita Navideña. Ahorras más de $60.000 COP y recibes ENVÍO TOTALMENTE GRATIS en Bucaramanga y su Área Metropolitana.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  unit = EXCLUDED.unit,
  base_cost = EXCLUDED.base_cost,
  price_retail = EXCLUDED.price_retail,
  price_micro = EXCLUDED.price_micro,
  price_restaurant = EXCLUDED.price_restaurant,
  previous_price_retail = EXCLUDED.previous_price_retail,
  previous_price_micro = EXCLUDED.previous_price_micro,
  previous_price_restaurant = EXCLUDED.previous_price_restaurant,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  is_in_season = EXCLUDED.is_in_season,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;
