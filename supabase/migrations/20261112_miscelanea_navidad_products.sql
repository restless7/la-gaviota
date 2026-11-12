-- Migration: Add Miscelánea Category & Christmas Cushion Products (La Tiendita Navideña)
INSERT INTO public.products (
  id, name, category, subcategory, unit, base_cost,
  price_retail, price_micro, price_restaurant,
  previous_price_retail, previous_price_micro, previous_price_restaurant,
  stock_quantity, is_active, is_in_season, image_url, description
) VALUES
(
  'prd_nav_01', 'Cojín Navideño Sagrada Familia Pesebre', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  45, true, true, '/IMAGES/navidad/cojin-sagrada-familia-pesebre.jpg',
  'Cojín decorativo premium con ilustración artística de la Sagrada Familia (San José, la Virgen María y el Niño Jesús en el pesebre de Belén). Confección en tela terciopelo suave al tacto con relleno siliconado antialérgico y cremallera invisible.'
),
(
  'prd_nav_02', 'Cojín Navideño Pesebre con Ángeles de Gloria', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  38, true, true, '/IMAGES/navidad/cojin-pesebre-angeles-gloria.jpg',
  'Elegante cojín navideño que representa el Nacimiento con ángeles dorados, guirnalda iluminada y mensaje Merry Christmas. Acabado de lujo para engalanar la sala familiar durante las novenas.'
),
(
  'prd_nav_03', 'Cojín Navideño Santa Noel con Saco de Regalos', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  50, true, true, '/IMAGES/navidad/cojin-santa-saco-regalos.jpg',
  'Papá Noel clásico en estilo vintage tierno con su saco desbordante de regalos y lazo rojo. Impresión textil de alta fidelidad que no pierde color con los lavados.'
),
(
  'prd_nav_04', 'Cojín Navideño Papá Noel Sonriente y Bastón de Caramelo', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  42, true, true, '/IMAGES/navidad/cojin-santa-baston-caramelo.jpg',
  'Tierno Papá Noel con bastón de dulce, canela y una cálida cabaña nevada de fondo. Transmite alegría, calidez y el espíritu más dulce de la Navidad.'
),
(
  'prd_nav_05', 'Cojín Navideño Santa y Pequeño Reno en el Bosque', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  40, true, true, '/IMAGES/navidad/cojin-santa-reno-bosque.jpg',
  'Ilustración entrañable de Santa con gafas acariciando a su pequeño cervatillo en medio de la nieve y frutos rojos de invierno. Aporta una vibra nórdica y mágica a tu sofá.'
),
(
  'prd_nav_06', 'Cojín Navideño Santa con Farol Rústico y Regalo Dorado', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  35, true, true, '/IMAGES/navidad/cojin-santa-farol-dorado.jpg',
  'Santa Claus sosteniendo un farol rústico y un elegante paquete de regalo dorado con su pequeño reno fiel. Colores vivos e iluminación cálida navideña.'
),
(
  'prd_nav_07', 'Cojín Navideño Muñeco de Nieve con Reno', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  48, true, true, '/IMAGES/navidad/cojin-muneco-nieve-reno.jpg',
  'Simpático muñeco de nieve con gorro de lana, bufanda y un reno bebé abrazándolo junto a un árbol iluminado. Diseño alegre e ideal para habitaciones y salas familiares.'
),
(
  'prd_nav_08', 'Cojín Navideño Osito de Nieve con Farol y Pijama', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  36, true, true, '/IMAGES/navidad/cojin-oso-farol-pijama.jpg',
  'Tierno osito navideño con pijama a cuadros y gorrito de nieve subiendo en una escalera con un farol encendido para coronar el árbol con la estrella dorada.'
),
(
  'prd_nav_09', 'Cojín Navideño Osito Tierno con Bola de Cristal de Nieve', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  34, true, true, '/IMAGES/navidad/cojin-oso-esfera-nieve.jpg',
  'Adorable oso de peluche abrigado con suéter rojo sosteniendo una bola de nieve mágica con un mini Santa dentro. Un toque de ternura pura para estas navidades.'
),
(
  'prd_nav_10', 'Cojín Navideño Duendecillos en Taller de Juguetes', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  30, true, true, '/IMAGES/navidad/cojin-duendecillos-taller.jpg',
  'Elfos navideños niño y niña con coronita y traje verde y rojo preparando cartas y regalos de Navidad junto al árbol brillante. Lleno de detalles y vivacidad.'
),
(
  'prd_nav_11', 'Cojín Navideño Duendes Traviesos en la Nieve con Ciervos', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Cojín 45x45 cm', 22000,
  34900, 32000, 29900, 45000, 40000, 38000,
  32, true, true, '/IMAGES/navidad/cojin-duendes-nieve-trineo.jpg',
  'Divertida escena de duendes jugando en la nieve con ciervos en el Polo Norte. Trae risas y fantasía navideña a cualquier rincón del hogar.'
),
(
  'prd_nav_combo4', 'Combo Navideño x4 Cojines Familiares a Elección', 'MISCELÁNEA', 'COJINES NAVIDEÑOS', 'Set x4 Cojines 45x45 cm', 75000,
  119900, 115000, 109000, 139600, 130000, 125000,
  25, true, true, '/IMAGES/navidad/cojin-santa-reno-amor.jpg',
  '¡El mejor combo para renovar toda tu sala! Elige 4 diseños de cojines de la colección La Tiendita Navideña. Ahorras $19.700 COP y recibes ENVÍO TOTALMENTE GRATIS en Bucaramanga y su Área Metropolitana.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  unit = EXCLUDED.unit,
  price_retail = EXCLUDED.price_retail,
  price_micro = EXCLUDED.price_micro,
  price_restaurant = EXCLUDED.price_restaurant,
  previous_price_retail = EXCLUDED.previous_price_retail,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  is_in_season = EXCLUDED.is_in_season,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;

