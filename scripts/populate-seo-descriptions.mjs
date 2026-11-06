// Populate SEO-optimized product descriptions for all missing products in Surtifruver La Gaviota
const SEO_DESCRIPTIONS = {
  // Fix 3 existing malformed descriptions
  prd_0053: 'Ahuyamín (zapallo tierno) fresco seleccionado en el campo santandereano. Rico en betacarotenos, vitaminas A y C y fibra digestiva; ideal para cremas, sopas, purés infantiles y guisos saludables. Compra ahuyamín fresco a domicilio en Bucaramanga, Floridablanca y Girón con Surtifruver La Gaviota.',
  prd_0071: 'Cebolla puerro fresca de tallo blanco, tierno y aromático. Rica en vitaminas A, C y K, antioxidantes y fibra prebiótica; indispensable para cremas gourmet, fondos de cocina, salteados y salsas en hogares y restaurantes de Bucaramanga y el área metropolitana.',
  prd_0149: 'Lenteja seleccionada ya remojada y lista para cocinar, ahorrando tiempo en tu cocina o restaurante. Fuente superior de proteína vegetal, hierro y fibra para sopas, menestras y almuerzos caseros. Pide lenteja remojada a domicilio en Bucaramanga con La Gaviota Fruver.',

  // FRUTAS (25 missing)
  prd_0018: 'Limón criollo (sutil o pajarito) extra jugoso y de aroma intenso, cosechado fresco en Santander. Alto aporte de vitamina C y antioxidantes naturales; ideal para limonadas, ceviches, aderezos y marinar carnes. Domicilios en Bucaramanga, Floridablanca y Girón.',
  prd_0019: 'Limón Taití fresco de cáscara verde brillante, sin semillas y con alto rendimiento de jugo. Seleccionado para hogares, restaurantes y bares en Bucaramanga; perfecto para bebidas refrescantes, coctelería, ensaladas y cocina profesional.',
  prd_0021: 'Mango Tommy maduro y firme, de pulpa dulce, jugosa y baja en fibra. Rico en vitaminas A y C, antioxidantes y energía natural; excelente para comer en porciones, ensaladas de frutas, jugos naturales y postres saludables a domicilio en Bucaramanga.',
  prd_0024: 'Manzana rosada fresca, crujiente y de dulzura equilibrada. Fuente natural de fibra soluble (pectina) y antioxidantes que favorecen la digestión y la salud cardiovascular; ideal para loncheras, snacks saludables y ensaladas en tu hogar.',
  prd_0025: 'Manzana de agua tropical, refrescante y sumamente jugosa con suave toque dulce. Conocida por su alto contenido de agua, bajo aporte calórico y propiedades hidratantes y digestivas. Frescura directa del campo en Surtifruver La Gaviota.',
  prd_0026: 'Mandarina dulce y jugosa de fácil pelado, seleccionada en su punto óptimo de maduración. Rica en vitamina C, flavonoides y fibra natural para fortalecer las defensas de toda la familia. Pídela fresca a domicilio en Bucaramanga y Santander.',
  prd_0028: 'Melón cantalupo fresco, aromático y de pulpa dulce y suave. Rico en agua, betacarotenos, vitamina C y potasio; ideal para desayunos saludables, jugos refrescantes, porciones de fruta y menús de restaurantes en Bucaramanga.',
  prd_0029: 'Mora de Castilla fresca seleccionada grano a grano en los cultivos altos de Santander. Conocida por su sabor agridulce intenso y alto contenido de antioxidantes y vitamina C; perfecta para jugos en agua o leche, mermeladas y repostería.',
  prd_0030: 'Naranja común fresca de excelente jugosidad y balance entre dulzura y acidez. Fuente natural de vitamina C, ácido fólico y energía para preparar el mejor jugo de naranja recién exprimido en hogares y negocios de Bucaramanga.',
  prd_0031: 'Naranja Valencia seleccionada por su corteza fina y altísimo rendimiento en jugo dulce natural. La favorita de hogares, cafeterías y restaurantes en Bucaramanga para jugos frescos, desayunos y preparaciones cítricas.',
  prd_0032: 'Naranja Tangelo premium, híbrido cítrico extraordinariamente jugoso, dulce y fácil de pelar. Rica en vitamina C y antioxidantes naturales; ideal para consumo directo, jugos gourmet y alimentación saludable a domicilio en Santander.',
  prd_0033: 'Papaya fresca en su punto ideal de madurez, de pulpa dulce, suave y color naranja intenso. Rica en papaína, fibra y vitaminas A y C que favorecen la digestión diaria; indispensable en desayunos de hogar, hoteles y restaurantes en Bucaramanga.',
  prd_0034: 'Patilla baby (sandía personal) dulce, crujiente y práctica para guardar en nevera. Altamente hidratante, rica en licopeno, vitaminas A y C y baja en calorías; el refresco natural perfecto para el clima de Bucaramanga, Floridablanca y Girón.',
  prd_0035: 'Patilla común (sandía roja) grande, dulce y súper jugosa seleccionada del campo. Fuente natural de hidratación, electrolitos y licopeno antioxidante; ideal para compartir en familia, eventos, jugos y porciones de fruta fresca.',
  prd_0036: 'Pera importada fresca de textura fina, jugosa y sabor dulce delicado. Rica en fibra dietaria, potasio y vitamina C; excelente para loncheras escolares, tablas de quesos, postres y snacks saludables a domicilio en Bucaramanga.',
  prd_0037: 'Pera criolla colombiana cosechada fresca, de pulpa firme y aroma tradicional. Aporta fibra natural, vitaminas y minerales esenciales; ideal para comer fresca, preparar compotas caseras, dulces en almíbar y postres típicos.',
  prd_0038: 'Piña Perolera santandereana auténtica, famosa por su abundante jugo y equilibrio único entre dulzura y toque cítrico. Rica en bromelina digestiva y vitamina C; insuperable para jugos naturales, chicha, postres y salsas en Bucaramanga.',
  prd_0039: 'Piña Oro Miel (Golden) extra dulce, de pulpa amarilla suave y baja acidez, cultivada en tierras santandereanas. Rica en vitamina C y enzimas digestivas; lista para consumir en rodajas, ensaladas, jugos y cocina gourmet.',
  prd_0040: 'Pitahaya amarilla colombiana de calidad exportación, dulce y exótica. Reconocida como el regulador digestivo natural por excelencia gracias a su fibra soluble y semillas bioactivas. Pídela fresca a domicilio en Surtifruver La Gaviota.',
  prd_0041: 'Toronja rosada fresca y jugosa, con su característico toque cítrico y ligeramente amargo. Baja en calorías y rica en vitamina C y antioxidantes que apoyan el metabolismo; ideal para jugos detox, desayunos fitness y coctelería.',
  prd_0042: 'Uchuva fresca seleccionada en tarro protector para conservar su textura firme y sabor agridulce tropical. Superalimento andino rico en provitamina A, vitamina C y antioxidantes; ideal para snacks, decoración de postres y ensaladas gourmet.',
  prd_0043: 'Uchuva en su cáscara natural (capacho), que preserva intacta su frescura y vida útil por más tiempo. Fruta exótica colombiana rica en vitaminas A y C; perfecta para disfrutar como snack saludable, en salsas o repostería.',
  prd_0044: 'Uchuva fresca descapachada y lista para consumir o procesar. Su vibrante sabor agridulce y alto aporte de antioxidantes la hacen ideal para jugos naturales, salsas para carnes, postres y consumo familiar en Bucaramanga.',
  prd_0045: 'Uva importada tipo Red Globe / sin semilla, dulce, firme y seleccionada racimo por racimo. Rica en resveratrol y polifenoles antioxidantes que cuidan el corazón; ideal para mesas de frutas, loncheras y postres en Bucaramanga.',
  prd_0046: 'Uva Isabella nacional fresca de aroma intenso y pulpa agridulce tradicional. Altamente concentrada en antocianinas y antioxidantes naturales; la preferida para jugos espesos, vinos artesanales, mermeladas y postres caseros.',

  // VERDURAS Y HORTALIZAS (56 missing)
  prd_0065: 'Zucchini amarillo (calabacín amarillo) tierno y fresco de piel brillante. Bajo en calorías y rico en fibra, potasio y vitamina C; aporta color y textura gourmet a vegetales salteados, parrilladas, lasañas vegetales y cremas.',
  prd_0066: 'Camote (batata dulce) fresco de pulpa suave y nutritiva. Excelente fuente de carbohidratos de absorción lenta, betacarotenos y fibra; ideal para hornear, preparar chips saludables, purés gourmet y guarniciones en Bucaramanga.',
  prd_0072: 'Coliflor fresca, blanca y compacta seleccionada directamente de cultivos de clima frío. Rica en fibra, vitamina C y antioxidantes; versátil para preparar al vapor, gratinada con queso, en arroz de coliflor keto o en cremas.',
  prd_0073: 'Cilantro fresco en atado personal (x500), de hojas verdes intensas y aroma inconfundible. El toque final indispensable para caldos santandereanos, changua, sopas, ajíes, guacamoles y picados frescos en tu hogar.',
  prd_0074: 'Cilantro fresco en atado grande (x2000) seleccionado para alto rendimiento en hogares numerosos, micromercados y restaurantes de Bucaramanga. Hojas frescas y aromáticas recién traídas del campo.',
  prd_0075: 'Cilantro fresco en mata completa con raíz para conservar su frescura y aroma por más días en tu cocina o negocio gastronómico. Esencial en sopas, sancochos, adobos y salsas de la gastronomía santandereana.',
  prd_0076: 'Champiñón fresco seleccionado en bandeja, limpio y de textura firme. Fuente saludable de proteína vegetal, vitaminas del complejo B y minerales; ideal para pastas, pizzas, cremas, salteados, carnes en salsa y ensaladas.',
  prd_0077: 'Champiñón entero fresco de sombrero firme y blanco, ideal para filetear al gusto o rellenar al horno. Ingrediente esencial para cocinas profesionales, restaurantes y recetas gourmet a domicilio en Bucaramanga.',
  prd_0078: 'Espinaca fresca de hojas verdes, tiernas y seleccionadas. Superalimento rico en hierro, ácido fólico, calcio y vitaminas A, C y K; perfecta para batidos verdes, tortillas, ensaladas frescas, pastas y cremas nutritivas.',
  prd_0079: 'Frijol verde desgranado fresco y tierno, listo para llevar directo a la olla sin perder tiempo. Rico en proteína vegetal, hierro y fibra; tradicional para frijoladas, sopas campesinas, mute santandereano y sudados caseros.',
  prd_0080: 'Frijol verde en concha recién cosechado, que conserva toda la humedad y ternura del grano tierno. Ideal para desgranar en casa y preparar los mejores frijoles verdes con costilla, sopas y guisos típicos en Bucaramanga.',
  prd_0081: 'Guacas frescas aromáticas seleccionadas del campo, hierba tradicional de la cocina andina colombiana. Aporta el sabor auténtico y herbal indispensable en sopas, ajiacos y guisos criollos.',
  prd_0082: 'Guascas frescas en hojas seleccionadas, el ingrediente secreto e irremplazable del auténtico ajiaco santafereño y sopas tradicionales colombianas. Frescura garantizada a domicilio en Bucaramanga, Floridablanca y Girón.',
  prd_0083: 'Guineo verde fresco seleccionado, base tradicional de las mejores sopas, sancochos, coladas y cayeye. Rico en potasio, almidón resistente y energía natural; directo del campo a tu cocina con Surtifruver La Gaviota.',
  prd_0084: 'Habichuela fresca, verde y crujiente sin hebras, seleccionada por su ternura. Rica en fibra, ácido fólico y vitaminas; ideal para ensaladas rusas, arroz con verduras, guisos con carne, sopas y salteados saludables.',
  prd_0088: 'Mazorca tierna desgranada fresca, lista para cocinar en minutos. Granos dulces y suaves perfectos para arroz con pollo, cremas de maíz, sopas, ensaladas, arepas de choclo y menús de restaurantes en Bucaramanga.',
  prd_0089: 'Mazorca criolla fresca en tusa, de grano firme y sabor tradicional colombiano. Indispensable para el sancocho, mute santandereano, mazorca asada, envueltos y arepas caseras con domicilio en Bucaramanga.',
  prd_0090: 'Mazorca bogotana (sabanera) tierna de grano grande, jugoso y suave. La preferida para asar a la brasa con mantequilla, desgranar en mazorcadas, preparar cremas de choclo y acompañar asados en Santander.',
  prd_0091: 'Papa criolla (papa amarilla) fresca seleccionada, pequeña y cremosa al cocinar. Joya de la gastronomía colombiana ideal para fritar doradita, acompañar asados y fritangas, o espesar el ajiaco y las sopas caseras.',
  prd_0092: 'Papa pastusa fresca de tierra fría, de textura harinosa y suave por dentro. La variedad número uno en Colombia para papa salada, purés cremosos, caldos de costilla, sudados y sopas tradicionales en Bucaramanga.',
  prd_0093: 'Papa única (papa de fritar / capira) de pulpa firme y bajo contenido de agua que no absorbe grasa. Ideal para papas a la francesa crujientes, chips caseros, papas chorreadas y alto rendimiento en restaurantes y comidas rápidas.',
  prd_0094: 'Papa pareja seleccionada de tamaño uniforme y excelente presentación. Perfecta para porciones estándar en restaurantes, casinos empresariales, papa salada, sudados y almuerzos ejecutivos en Bucaramanga y Santander.',
  prd_0095: 'Pepino cohombro fresco, verde y crujiente con alto contenido de agua (96%) y muy pocas calorías. Refrescante y digestivo; indispensable para ensaladas frescas, jugos verdes detox y rodajas hidratantes.',
  prd_0096: 'Pepino de rellenar (archucha o caigua) fresco y tierno, hortaliza tradicional de la cocina santandereana y colombiana. Ideal para preparar relleno con carne o pollo, en guisos caseros y sopas saludables.',
  prd_0097: 'Perejil fresco en mata abundante de hojas verdes intensas y tallos aromáticos. Rico en vitamina C, hierro y antioxidantes; ideal para chimichurris, salsas verdes, adobos, sopas y decoración gastronómica en restaurantes.',
  prd_0098: 'Perejil fresco en atado (x1000) seleccionado del campo. Aporta frescura, aroma herbal y nutrientes esenciales a tus caldos, arroces, pescados, pastas y aderezos caseros en Bucaramanga.',
  prd_0099: 'Picado de seco pequeño con verduras frescas recién lavadas y troceadas (habichuela, zanahoria, arveja y más). Solución práctica y rápida para preparar arroces mixtos, guisos y ensaladas calientes sin perder tiempo picando.',
  prd_0100: 'Picado de seco grande familiar o para negocio, elaborado a diario con verduras frescas seleccionadas en La Gaviota. Ahorra tiempo en tu cocina preparando arroz con verduras, carnes guisadas y acompañamientos saludables.',
  prd_0101: 'Picado de sopa pequeño listo para la olla, con mezcla balanceada de verduras y tubérculos frescos picados del día. Prepara una sopa casera nutritiva y deliciosa en pocos minutos en Bucaramanga.',
  prd_0102: 'Picado de sopa grande familiar con selección completa de verduras, hortalizas y tubérculos frescos recién picados. El aliado perfecto para hogares y restaurantes que buscan sabor casero y ahorro de tiempo.',
  prd_0103: 'Verdura para Chop Suey (Shosue) fresca en bandeja, con julianas crujientes de vegetales seleccionados y raíces listas para saltear al wok con pollo, carne o camarones. Cocina oriental saludable y rápida en casa.',
  prd_0104: 'Mezcla fresca para Chop Suey (Shosue) por libra (500 gr), con vegetales frescos cortados en julianas para salteados orientales, arroz chino y platos al wok en hogares y restaurantes de Bucaramanga.',
  prd_0105: 'Ensalada agridulce fresca en bandeja, lista para mezclar y servir. Combinación equilibrada de vegetales crujientes y toque frutal que acompaña a la perfección almuerzos familiares, carnes y platos especiales.',
  prd_0106: 'Ensalada agridulce fresca por libra (500 gr) preparada a diario con ingredientes seleccionados de primera calidad. Práctica, saludable y lista para servir en tu hogar o negocio gastronómico en Bucaramanga.',
  prd_0107: 'Ensalada fresca del día en bandeja, con vegetales lavados y cortados listos para aderezar. La opción más rápida y saludable para completar tus almuerzos diarios con fibra y vitaminas naturales.',
  prd_0108: 'Ensalada fresca en presentación de media libra (500 gr), elaborada con hortalizas crujientes seleccionadas a diario en Surtifruver La Gaviota. Lista para servir y disfrutar en minutos.',
  prd_0109: 'Pimentón verde fresco de paredes gruesas, crujientes y aroma intenso. Rico en vitamina C y antioxidantes; indispensable para hogao, guisos, arroces, fajitas, carnes salteadas y sofritos en Bucaramanga.',
  prd_0110: 'Pimentón amarillo dulce y jugoso de color vibrante y calidad gourmet. Aporta dulzura suave, altísimo contenido de vitamina C y presentación vistosa a ensaladas, salteados, brochetas y platos de restaurante.',
  prd_0111: 'Pimentón rojo maduro, carnoso y naturalmente dulce, rico en licopeno y vitamina C. Excelente para asar, rellenar al horno, licuar en salsas, preparar arroces especiales y realzar el sabor de tus guisos.',
  prd_0112: 'Plátano hartón maduro seleccionado, de cáscara amarilla con pintas negras y pulpa dulce y suave. Ideal para tajadas doradas, maduro con queso, aborrajados, tortas de plátano y acompañamiento de todo almuerzo colombiano.',
  prd_0113: 'Plátano maduro especial para asar, seleccionado por su tamaño y punto exacto de dulzura firme. Perfecto para llevar al horno, airfryer o parrilla relleno con queso y bocadillo en Bucaramanga.',
  prd_0114: 'Plátano hartón verde fresco y firme recién traído del campo. El rey de los patacones crujientes, tostones, monedas de plátano, sopas de patacón y sancocho santandereano en hogares y restaurantes.',
  prd_0115: 'Rábano rojo fresco y crujiente, de sabor ligeramente picante y refrescante. Rico en vitamina C, agua y compuestos digestivos; ideal para dar color y textura crujiente a tus ensaladas, tacos y entradas.',
  prd_0118: 'Raíz china (brotes de soya) fresca, blanca y crujiente seleccionada del día. Rica en proteína vegetal, enzimas y fibra con mínimo aporte calórico; indispensable para arroz chino, chop suey, lumpias y ensaladas asiáticas.',
  prd_0119: 'Repollo morado fresco y compacto, de hojas crujientes cargadas de antocianinas antioxidantes y vitamina C. Aporta color vibrante y nutrición a ensaladas frescas, coleslaw, tacos y encurtidos saludables.',
  prd_0120: 'Repollo blanco (verde) fresco y tierno de hojas jugosas. Clásico de la cocina colombiana para ensaladas de repollo con zanahoria, sopas, sudados, niños envueltos y guarniciones de restaurantes en Bucaramanga.',
  prd_0121: 'Tomate cherry fresco en estuche protector, dulce, jugoso y firme en cada bocado. Rico en licopeno y vitamina C; ideal para ensaladas gourmet, pastas mediterráneas, pasabocas con queso y decoración de platos.',
  prd_0122: 'Tomate cherry fresco a granel por libra (500 gr), seleccionado por su dulzura y frescura. Excelente rendimiento para restaurantes, catering, ensaladas frescas, tomates confitados y salteados en Bucaramanga.',
  prd_0123: 'Tomate chonto fresco de los valles de Santander, carnoso, rojo y jugoso. La base indispensable del hogao colombiano, guisos, salsas caseras, sudados y ensaladas diarias en hogares y restaurantes de Bucaramanga.',
  prd_0124: 'Tomate milano verde / pintón de pulpa firme y rodaja grande uniforme. Especialmente seleccionado para lonjas en hamburguesas, sándwiches, ensaladas caprese y presentación impecable en cocina profesional.',
  prd_0125: 'Yota (cidra o chayote) fresca y tierna, hortaliza tradicional de la cocina santandereana baja en calorías y rica en agua y fibra. Ideal para guisos criollos, sopas, tortas de yota y dietas saludables.',
  prd_0126: 'Yuca fresca seleccionada de cáscara sana y pulpa blanca que abre harinosa y suave al cocinar. Imprescindible para yuca sudada, yuca frita, sancocho, mute y acompañamiento de carne oreada en Santander.',
  prd_0128: 'Yuca fresca ya pelada, limpia y seleccionada que garantiza cero desperdicio y cocción rápida y blanda. Lista para hervir o fritar al instante en hogares y restaurantes de Bucaramanga, Floridablanca y Girón.',
  prd_0129: 'Papa fresca seleccionada y lavada, libre de tierra y lista para pelar o cocinar con cáscara. Ahorra tiempo y mantén limpia tu cocina en el hogar o restaurante con la calidad de Surtifruver La Gaviota.',
  prd_0130: 'Habichuela fresca ya despuntada y picada en presentación práctica, lista para cocinar al vapor, en guisos o arroces. Frescura del día que ahorra tiempo de alistamiento en tu cocina.',
  prd_0131: 'Zanahoria fresca lavada y picada en cubos uniformes, lista para agregar a sopas, arroces, ensalada rusa y guisos. Rica en betacarotenos y vitamina A con toda la practicidad de La Gaviota Fruver.',

  // PULPAS (9 missing)
  prd_0132: 'Pulpa de curuba 100% fruta natural seleccionada, sin conservantes artificiales y lista para licuar. Disfruta en segundos de un cremoso jugo de curuba en agua o en leche con todo el sabor del campo colombiano.',
  prd_0133: 'Pulpa de fresa natural de 500 g elaborada con fresas maduras seleccionadas. Práctica, rendidora y rica en vitamina C para preparar jugos naturales, batidos, smoothies y postres en hogares y restaurantes de Bucaramanga.',
  prd_0135: 'Pulpa de guayaba 100% natural, espesa y aromática, rica en vitamina C y antioxidantes. Lista para licuar y obtener un delicioso jugo casero sin necesidad de colar ni desperdiciar fruta.',
  prd_0136: 'Pulpa de lulo natural seleccionada con el toque ácido y refrescante característico del lulo colombiano. Ideal para preparar lulada, jugos fríos y granizados al instante en tu hogar o negocio en Bucaramanga.',
  prd_0137: 'Pulpa de maracuyá 100% fruta natural de aroma tropical intenso y alto rendimiento. Perfecta para jugos refrescantes, limonadas de maracuyá, coctelería, mousses y salsas gourmet sin esfuerzo.',
  prd_0138: 'Pulpa de mora de Castilla 100% natural, concentrada y rica en antioxidantes. Lista para licuar en agua o leche y servir jugos espesos y nutritivos en hogares, cafeterías y restaurantes de Santander.',
  prd_0139: 'Pulpa de piña natural elaborada con piñas santandereanas dulces y jugosas. Práctica y rendidora para preparar jugos naturales, piñas coladas, batidos digestivos y postres en segundos.',
  prd_0140: 'Pulpa de tomate de árbol 100% fruta natural, rica en vitaminas A, C y hierro. Conserva todo el sabor y espesor tradicional para preparar jugos caseros nutritivos al instante en Bucaramanga.',
  prd_0141: 'Pulpa de mezcla tropical 100% fruta natural, combinación exótica y refrescante de frutas colombianas seleccionadas. Lista para licuar y disfrutar un jugo lleno de vitaminas y sabor en cualquier momento.',

  // VARIOS (19 missing)
  prd_0142: 'Maíz pelado especial para mute santandereano, tierno, limpio y seleccionado según la receta tradicional de nuestra tierra. El ingrediente principal para preparar el auténtico mute de domingo en Bucaramanga.',
  prd_0143: 'Masa de maíz amarillo molido tradicional con chicharrón santandereano incorporado, lista para armar y asar las auténticas arepas santandereanas en casa o restaurante. Sabor criollo inigualable.',
  prd_0144: 'Masa de maíz amarillo puro recién molido sin chicharrón, suave y lista para amasar arepas amarillas, empanadas caseras, hallacas y envueltos tradicionales con el sello de calidad de Santander.',
  prd_0145: 'Masa de maíz blanco peto recién molido, limpia y suave para preparar arepas blancas, empanadas y recetas típicas en casa. Frescura diaria garantizada con entrega a domicilio en Bucaramanga.',
  prd_0146: 'Maíz blanco seleccionado especial para peto, mazamorra, arepas y sopas tradicionales. Grano limpio y rendidor de primera calidad disponible a domicilio en Surtifruver La Gaviota.',
  prd_0147: 'Garbanzo seleccionado ya remojado (250 g), tierno y listo para la cocción rápida. Rico en proteína vegetal, hierro y fibra; indispensable para el mute santandereano, callos con garbanzo, potajes y hummus.',
  prd_0150: 'Hoja de bijao / plátano fresca seleccionada y soasada para envolver tamales santandereanos, hallacas, hayacas y pasteles de arroz. Aporta el aroma y sabor tradicional del campo a tus preparaciones.',
  prd_0151: 'Carbón vegetal en bolsa de excelente poder calórico y encendido rápido. El complemento indispensable para tus asados de fin de semana, carnes a la brasa y parrilladas familiares en Bucaramanga.',
  prd_0153: 'Chile jalapeño fresco en presentación de 125 g, de picor medio y aroma herbal crujiente. Perfecto para nachos, tacos, guacamole, hamburguesas artesanales, salsas picantes y encurtidos.',
  prd_0155: 'Miel de abejas pura 100% natural en botella grande, cosechada en apiarios de Santander. Endulzante natural rico en enzimas, antioxidantes y propiedades antibacterianas para infusiones, desayunos y remedios caseros.',
  prd_0156: 'Miel de abejas pura en botella pequeña práctica, 100% natural y floral. Ideal para endulzar aromáticas, acompañar frutas, aliviar la garganta y disfrutar la pureza del campo santandereano.',
  prd_0157: 'Propóleo natural de abejas, extracto apícola tradicional reconocido por sus propiedades antibacterianas, antivirales y fortalecedoras del sistema respiratorio e inmunológico. Bienestar natural en La Gaviota.',
  prd_0158: 'Huevos frescos tamaño AAA / Jumbo seleccionados de granjas avícolas de Santander. Yema de color intenso y alto aporte de proteína de máxima calidad para desayunos, panadería y restaurantes en Bucaramanga.',
  prd_0159: 'Huevos frescos tipo AA de granja santandereana, seleccionados a diario por su frescura y calidad nutricional. El básico infaltable de la canasta familiar y cocinas comerciales en Bucaramanga, Floridablanca y Girón.',
  prd_0160: 'Huevos frescos tipo A seleccionados de granja local, nutritivos y económicos para el consumo diario de tu hogar, desayunos, tortas y preparaciones caseras con entrega segura a domicilio.',
  prd_0161: 'Queso doble crema / mozzarella tajado fresco en presentación de 250 g (cuarto). Suave, delicioso y de excelente fundido para sándwiches, arepas rellenas, hamburguesas y desayunos familiares.',
  prd_0162: 'Queso tajado fresco en presentación familiar de 500 g (libra), de textura suave y fundido parejo. Ideal para hogares, cafeterías y restaurantes en Bucaramanga en preparación de sándwiches, gratinados y desayunos.',
  prd_0163: 'Cuajada criolla artesanal fresca de leche entera campesina. Textura suave y sabor tradicional perfecto para acompañar con melado, bocadillo veleño, chocolate caliente, arepas o almojábanas.',
  prd_0164: 'Morcillas (rellenas) artesanales frescas preparadas con receta tradicional santandereana. Ideales para fritar o asar en picadas, fritangas, desayunos criollos y asados familiares en Bucaramanga.',
  prd_0165: 'Cuajada fresca campesina de 500 g elaborada diariamente con leche pura. Baja en sal y rica en calcio y proteína; deliciosa con dulce de guayaba, en desayunos santandereanos o asada al sartén.',

  // CARNES X 500 GRAMOS - RES, CERDO, VÍSCERAS, POLLO, PESCADO (44 missing)
  prd_0166: 'Costilla de res fresca y carnuda (500 g), seleccionada con el balance ideal de carne y hueso para dar sustancia inigualable al caldo de costilla santandereano, sancocho de res o costillas sudadas.',
  prd_0167: 'Cogote de res fresco (500 g), corte jugoso y lleno de sabor tradicional. Excelente para preparar carne sudada, guisos caseros, carne desmechada, sopas nutritivas y almuerzos familiares en Bucaramanga.',
  prd_0168: 'Lomo fino de res (lomito / solomillo) de 500 g, el corte más tierno, magro y selecto de la res. Ideal para medallones a la plancha, baby beef, parrilla gourmet y platos especiales con entrega refrigerada.',
  prd_0169: 'Punta de anca de res seleccionada (500 g), corte estrella de los asados colombianos con su cobertura justa de grasa que garantiza jugosidad y sabor extraordinario a la parrilla o plancha.',
  prd_0170: 'Carne de res cecina / corte tradicional santandereano (500 g), seleccionado y porcionado en láminas ideales para asar, preparar carne oreada casera o disfrutar a la plancha con yuca y arepa.',
  prd_0171: 'Herradero de res fresco (500 g), corte magro y versátil de primera calidad. Excelente para asar a la plancha, preparar en bistec a caballo, carne en posta o porciones ejecutivas suaves y jugosas.',
  prd_0172: 'Hueso carnudo de res fresco (500 g) con abundante carne adherida, indispensable para dar sustancia, colágeno y sabor profundo a tus sopas caseras, frijoladas, mute y sancochos en Bucaramanga.',
  prd_0173: 'Murillo de res fresco (500 g), corte gelatinoso y tierno al cocinar lentamente. El preferido para sudados jugosos, estofados, ossobuco casero y caldos reconfortantes ricos en colágeno.',
  prd_0174: 'Carne molida de res fresca (500 g) seleccionada con bajo porcentaje de grasa, recién molida con estricta higiene. Lista para albóndigas, salsa boloñesa, hamburguesas caseras, lasañas y rellenos.',
  prd_0175: 'Panceta (tocineta carnuda) de cerdo fresca de 500 g, con capas perfectas de carne y piel para preparar chicharrones crocantes al horno, airfryer o barril en tus reuniones en Bucaramanga.',
  prd_0176: 'Costillas de cerdo frescas y carnudas (500 g), tiernas y jugosas. Ideales para preparar al horno o parrilla en salsa BBQ, costillitas agridulces, fritas o en guisos y frijoladas.',
  prd_0177: 'Pezuña de cerdo fresca y limpia (500 g), ingrediente clásico de la cocina tradicional para aportar textura gelatinosa y sabor auténtico al mute santandereano, frijoladas y sancochos.',
  prd_0178: 'Papada de cerdo fresca seleccionada (500 g), corte jugoso y tradicional utilizado en la gastronomía santandereana para fritangas, chicharrones tiernos y guisos criollos.',
  prd_0179: 'Lomo fino de cerdo (solomillo) fresco de 500 g, corte extra magro, tierno y saludable. Perfecto para medallones en salsa de ciruelas o champiñones, asados a la plancha y cocina familiar.',
  prd_0180: 'Pierna de cerdo fresca y magra (500 g), corte rendidor de primera calidad. Ideal para porcionar en chuletas, asar al horno, preparar cerdo agridulce, brochetas o guisos caseros.',
  prd_0181: 'Chicharrón de cerdo carnudo fresco (500 g), cortado y listo para sofreír o llevar al airfryer hasta quedar dorado y crujiente. El acompañante infaltable de la bandeja paisa, frijolada y picadas.',
  prd_0182: 'Chorizos de cerdo artesanales frescos (500 g), elaborados con carne seleccionada y especias criollas. Jugosos y llenos de sabor para asados, picadas, desayunos con arepa y almuerzos en Bucaramanga.',
  prd_0183: 'Carne molida de cerdo fresca (500 g) magra y suave, ideal para mezclar en albóndigas, hamburguesas gourmet, rellenos de tamales, empanadas, pastas y recetas orientales.',
  prd_0184: 'Hígado de res fresco seleccionado, limpio y tierno. Fuente excepcional de hierro hemo, vitamina B12 y proteína para combatir la anemia; delicioso encebollado o a la plancha en Bucaramanga.',
  prd_0185: 'Callo de res (mondongo) entero fresco y cuidadosamente limpio. El ingrediente principal para preparar el auténtico mute santandereano, sopa de mondongo y callos a la madrileña con garbanzos.',
  prd_0186: 'Callo de res (mondongo) fresco ya limpio y picado en cuadritos, ahorrando horas de alistamiento en tu cocina. Listo para cocinar en mute santandereano, sopa de mondongo o guisos tradicionales.',
  prd_0187: 'Bofe de res fresco y limpio, corte tradicional rico en proteínas y minerales, muy apreciado para fritar en picadas criollas, chanfaina y preparaciones típicas colombianas.',
  prd_0189: 'Pajarilla fresca de res seleccionada, corte tradicional rico en hierro y nutrientes, ideal para sopas criollas, guisos y recetas autóctonas con frescura garantizada en La Gaviota.',
  prd_0190: 'Cuajo de res fresco y limpio seleccionado para preparaciones tradicionales, sopas típicas y guisos criollos en hogares y piqueteadero de Bucaramanga y Santander.',
  prd_0191: 'Libro de res (librillo) fresco y limpio (500 g), corte tradicional de excelente textura para sopas de mondongo, mute santandereano y guisos criollos.',
  prd_0192: 'Mano de res fresca y limpia (500 g), rica en colágeno natural. Indispensable para dar el espesor y sustancia auténtica al mute santandereano, caldos nutritivos y gelatina de pata.',
  prd_0193: 'Pata de res fresca y limpia (500 g), corte tradicional de alto aporte de colágeno para el verdadero mute santandereano, sopas espesas y cocidos tradicionales en Bucaramanga.',
  prd_0194: 'Pollo entero fresco de granja seleccionado, limpio y de carne tierna y jugosa. Rinde para toda la familia asado al horno, sudado, en sancocho o despresado en casa.',
  prd_0195: 'Gallina entera fresca seleccionada, de sabor profundo y tradicional. La reina indiscutible del sancocho de gallina en leña u olla, caldos sustanciosos y arroces festivos en Santander.',
  prd_0196: 'Pechuga de pollo fresca (500 g), corte magro alto en proteína y bajo en grasa. Versátil para filetes a la plancha, pollo desmechado, arroz con pollo, ensaladas fitness y apanados.',
  prd_0197: 'Pierna pernil de pollo fresca (500 g), el corte más jugoso y sabroso para preparar pollo sudado, al horno con papas, frito o a la brasa en hogares y restaurantes de Bucaramanga.',
  prd_0198: 'Rabadilla de pollo fresca (500 g), ideal para dar sustancia y sabor casero a caldos de pollo, sopas de verduras, consomés y fondos de cocina económicos y nutritivos.',
  prd_0199: 'Bandeja de menudencias de pollo frescas y limpias (hígado, molleja, corazón, pescuezo y patas). Rica en hierro y colágeno para sopas, consomés, arroz con menudencias y caldos reconfortantes.',
  prd_0200: 'Pollo criollo semicriollo fresco (500 g), criado en campo con carne firme y sabor auténtico de finca. Ideal para sudados tradicionales, caldos nutritivos y sancochos en Bucaramanga.',
  prd_0201: 'Gallina criolla campesina fresca seleccionada, el ingrediente estrella para el verdadero sancocho santandereano de gallina, pepitoria y caldos de máxima sustancia y sabor.',
  prd_0202: 'Trucha arcoíris fresca seleccionada (500 g), pescado de aguas frías rico en Omega-3 y proteína limpia. Lista para preparar a la plancha, al ajillo, gratinada o al horno en minutos.',
  prd_0203: 'Mojarra roja / plateada fresca (500 g), limpia y carnuda. La favorita en Colombia para preparar mojarra frita dorada acompañada de patacón, arroz con coco y ensalada fresca.',
  prd_0204: 'Bagre entero fresco seleccionado de carne blanca, suave y sin espinas pequeñas. Ideal para porcionar en postas para bagre en salsa criolla, viudo de pescado o bagre frito.',
  prd_0205: 'Cabeza de bagre fresca (500 g) con abundante carne y sustancia, la base indispensable para preparar el mejor caldo de pescado levantamuertos y cazuelas en Bucaramanga.',
  prd_0206: 'Posta / pechuga de bagre fresca (500 g), corte limpio y carnudo sin espinas menudas. Perfecta para bagre en salsa criolla con yuca y papa, apanado o sudado en leche de coco.',
  prd_0207: 'Cachama fresca seleccionada (500 g), pescado de carne jugosa y excelente rendimiento. Deliciosa frita, asada a la brasa, sudada en salsa criolla o al horno con vegetales.',
  prd_0208: 'Tilapia fresca seleccionada (500 g), de carne blanca suave y alto valor proteico. Fácil de preparar frita, al vapor, al horno con finas hierbas o en filetes para toda la familia.',
  prd_0209: 'Camarones seleccionados limpios y frescos, ricos en proteína magra y minerales. Ideales para ceviches, arroz con camarones, pastas marineras, cazuelas y salteados al ajillo en Bucaramanga.',
  prd_0210: 'Pulpo seleccionado de textura tierna y sabor marino gourmet. Excelente para preparar pulpo a la parrilla, en ceviche, al olivo, cazuelas de mariscos y arroces especiales.',
  prd_0211: 'Pescado blanquillo fresco de carne blanca, suave y delicada. Ideal para sudados tradicionales, pescado frito, caldos nutritivos y almuerzos familiares en Santander.',

  // CONDIMENTOS X 125 GR (9 missing)
  prd_0212: 'Comino molido puro en presentación de 125 g, especia de aroma cálido e intenso indispensable en el adobo de carnes, frijoles, mute santandereano, sopas, guisos y empanadas.',
  prd_0214: 'Paprika (pimentón dulce molido) de 125 g, condimento natural de color rojo vibrante y sabor suave ahumado. Realza carnes, pollos al horno, papas rústicas, arroces y salsas.',
  prd_0215: 'Ajo molido deshidratado en presentación de 125 g, práctico y concentrado para sazonar al instante carnes, aves, pescados, arroces, mantequillas de ajo y aderezos sin pelar ni picar.',
  prd_0216: 'Ajo Mix condimentado listo para usar, mezcla aromática balanceada que aporta el toque exacto de ajo y especias a tus carnes, asados, sopas y salteados diarios.',
  prd_0217: 'Finas hierbas seleccionadas en presentación de 125 g, mezcla aromática mediterránea ideal para sazonar pechugas a la plancha, pescados, pastas, papas al horno y ensaladas.',
  prd_0219: 'Orégano seco picado de 125 g de aroma intenso y fresco. Ingrediente esencial para pizzas, pastas, salsas napolitanas, carnes asadas, ensaladas y adobos caseros.',
  prd_0220: 'Laurel seleccionado picado en presentación de 125 g, hoja aromática tradicional que perfuma y realza el sabor de estofados, carnes sudadas, lentejas, frijoles y fondos de cocina.',
  prd_0221: 'Tomillo seco aromático en presentación de 125 g, hierba indispensable en la cocina colombiana para adobar carnes, pollos, pescados, guisos, sopas y papas al vapor.',
  prd_0222: 'Color natural (achiote / cúrcuma condimentada) en presentación de 125 g para dar el tono dorado apetitoso y sabor tradicional a tus sopas, arroces, tamales, guisos y empanadas.',

  // FRUTOS SECOS Y ESPECIAS (10 missing)
  prd_0223: 'Semillas de calabaza naturales en presentación de 125 g, crujientes y ricas en magnesio, zinc, ácidos grasos saludables y proteína vegetal. Ideales para ensaladas, bowls de avena, panes y snacks.',
  prd_0224: 'Semillas de chía seleccionadas (125 g), superalimento rico en Omega-3 vegetal, fibra soluble, calcio y antioxidantes. Perfectas para pudines de chía, batidos, yogures y digestión saludable.',
  prd_0225: 'Quinua en grano seleccionada (125 g), pseudocereal andino con proteína completa de alto valor biológico, fibra y hierro. Ideal para ensaladas gourmet, bowls saludables, sopas y reemplazo del arroz.',
  prd_0226: 'Pistachos seleccionados tostados en presentación de 125 g, fruto seco premium rico en grasas saludables, antioxidantes y proteína. El snack saludable perfecto y toque gourmet para postres y ensaladas.',
  prd_0227: 'Nueces seleccionadas en presentación de 125 g, fuente superior de Omega-3, antioxidantes y energía cerebral. Ideales para consumir como snack, en ensaladas, repostería, brownies y desayunos fitness.',
  prd_0228: 'Maní seleccionado con sal en presentación de 125 g, crujiente y rico en proteína y energía natural. Excelente como pasabocas saludable para compartir o acompañar tus tardes en Bucaramanga.',
  prd_0229: 'Maní crudo natural sin sal (125 g), limpio y seleccionado. Ideal para tostar en casa, preparar mantequilla de maní casera, salsas orientales, repostería y alimentación saludable sin sodio.',
  prd_0230: 'Habas tostadas naturales en presentación de 125 g, snack andino crujiente alto en fibra y proteína vegetal. Una alternativa saludable y deliciosa para calmar el hambre entre comidas.',
  prd_0231: 'Habas tostadas picantes en presentación de 125 g, crujientes y con el toque picante justo para disfrutar como pasabocas lleno de proteína y sabor en tus reuniones.',
  prd_0232: 'Granola artesanal crujiente en presentación de 125 g, mezcla nutritiva de avena, frutos secos y semillas que aporta energía sostenida y fibra para acompañar yogur, fruta picada y desayunos saludables.',

  // AROMÁTICAS Y HIERBAS X 125 GR (10 missing)
  prd_0237: 'Hojas de eucalipto aromático seleccionado (125 g), tradicionalmente utilizado en infusiones y vaporizaciones naturales para despejar las vías respiratorias y purificar el ambiente del hogar.',
  prd_0239: 'Aromática de tomillo natural seleccionado (125 g), excelente tanto para infusiones digestivas y respiratorias como para aromatizar carnes, caldos y recetas gourmet en casa.',
  prd_0240: 'Aromática de orégano natural en hoja (125 g), apreciado por sus propiedades digestivas y antioxidantes en infusión caliente, además de su uso culinario tradicional.',
  prd_0241: 'Hojas de alcachofa para infusión aromática (125 g), reconocida en la medicina natural por apoyar la función hepática, la digestión de las grasas y la depuración del organismo.',
  prd_0242: 'Manzanilla dulce seleccionada para aromática (125 g), flor natural relajante y digestiva ideal para aliviar el estrés, mejorar el descanso nocturno y calmar el estómago después de las comidas.',
  prd_0243: 'Hierbabuena aromática seleccionada (125 g), de aroma mentolado y refrescante. Perfecta para aguas aromáticas digestivas, tés fríos, limonadas de hierbabuena y coctelería en Bucaramanga.',
  prd_0244: 'Toronjil aromático natural (125 g), hierba relajante de suave aroma cítrico utilizada tradicionalmente en infusiones para calmar los nervios, conciliar el sueño y favorecer la digestión.',
  prd_0245: 'Flor de Jamaica deshidratada seleccionada (125 g), rica en antioxidantes y vitamina C. Ideal para preparar agua de Jamaica fría o caliente, bebida refrescante, diurética y digestiva sin azúcar.',
  prd_0246: 'Pulmonaria natural para infusión aromática (125 g), planta tradicionalmente empleada con miel y limón para el cuidado de la garganta y el bienestar respiratorio en días fríos.',
  prd_0247: 'Limonaria (hierba luisa / lemongrass) aromática seleccionada (125 g), de fresco aroma cítrico. Deliciosa en infusiones calientes, aguapanela con limonaria y bebidas frías refrescantes.',

  // KITS NEGOCIOS / MAYORISTAS (8 missing)
  prd_0248: 'Papa pastusa seleccionada por arroba (@ / 12.5 kg), presentación mayorista de ahorro para restaurantes, casinos, micromercados y familias grandes en Bucaramanga, Floridablanca y Girón.',
  prd_0249: 'Papa única especial para fritar por arroba (@ / 12.5 kg), alto rendimiento y firmeza garantizada para restaurantes, asaderos, negocios de comidas rápidas y hogares en Santander.',
  prd_0250: 'Papa pareja seleccionada por arroba (@ / 12.5 kg), tamaño uniforme y calidad superior a precio mayorista para cocinas profesionales, hoteles y negocios gastronómicos en Bucaramanga.',
  prd_0251: 'Tomate chonto fresco por canastilla mayorista, seleccionado en su punto óptimo de madurez para restaurantes, pizzerías, salsamentarias y micromercados con entrega directa en Bucaramanga.',
  prd_0252: 'Tomate chonto fresco santandereano por arroba (@), ideal para alto consumo en hogares, restaurantes y negocios de alimentos con el respaldo de calidad y precio de Surtifruver La Gaviota.',
  prd_0253: 'Plátano hartón verde seleccionado por arroba (@), calibre superior para patacones, sopas y frituras de alto rendimiento en restaurantes, negocios y familias en Bucaramanga.',
  prd_0254: 'Plátano hartón maduro seleccionado por arroba (@), dulce y firme para tajadas, horneados y acompañamientos de almuerzos ejecutivos en restaurantes y negocios de Santander.',
  prd_0255: 'Kit Chévere de la Semana de Surtifruver La Gaviota: combo ahorrador con selección fresca de frutas, verduras, hortalizas y tubérculos cosechados en Santander con domicilio en Bucaramanga, Floridablanca y Girón.'
};

async function run() {
  const keys = Object.keys(SEO_DESCRIPTIONS);
  console.log(`Prepared ${keys.length} SEO descriptions.`);

  // Build a single SQL CASE statement to update all 195 products atomically in production Supabase (tcjeiizrarwerarcfyky)
  const cases = keys.map(id => {
    const escaped = SEO_DESCRIPTIONS[id].replace(/'/g, "''");
    return `WHEN '${id}' THEN '${escaped}'`;
  }).join('\n    ');
  const idList = keys.map(id => `'${id}'`).join(', ');

  const sql = `
    UPDATE public.products
    SET description = CASE id
      ${cases}
      ELSE description
    END
    WHERE id IN (${idList});
  `;

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("Missing SUPABASE_ACCESS_TOKEN environment variable");
    process.exit(1);
  }

  const res = await fetch("https://api.supabase.com/v1/projects/tcjeiizrarwerarcfyky/database/query", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    console.error("Failed to update production descriptions:", await res.text());
    process.exit(1);
  }

  // Verify remaining missing descriptions in production
  const verifyRes = await fetch("https://api.supabase.com/v1/projects/tcjeiizrarwerarcfyky/database/query", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "SELECT count(*) as total, count(*) FILTER (WHERE description IS NULL OR trim(description) = '') as missing FROM public.products;"
    })
  });
  const verifyData = await verifyRes.json();
  console.log("Production verification:", verifyData);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
