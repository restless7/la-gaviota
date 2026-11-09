export interface BlogSection {
  id: string;
  heading: string;
  content: string;
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  callout?: {
    type: 'tip' | 'warning' | 'stat' | 'quote';
    title: string;
    text: string;
  };
  bulletPoints?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  category: 'Hogar & Ahorro' | 'Restaurantes & B2B' | 'Temporada & Cosechas' | 'Tips de Frescura';
  categorySlug: 'hogar-ahorro' | 'restaurantes-b2b' | 'temporada-cosechas' | 'tips-frescura';
  publishedAt: string;
  formattedDate: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  heroImage: {
    src: string;
    alt: string;
    caption?: string;
  };
  tags: string[];
  keywords: string[];
  targetAudience: 'Hogares Santandereanos' | 'Restaurantes & Hoteles' | 'General';
  sections: BlogSection[];
  cta: {
    badge: string;
    title: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    type: 'shop' | 'b2b' | 'kit' | 'whatsapp';
  };
  faqs?: {
    question: string;
    answer: string;
  }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'donde-comprar-frutas-verduras-frescas-domicilio-bucaramanga',
    title: '¿Dónde comprar frutas y verduras frescas a domicilio en Bucaramanga? Guía del comprador inteligente (2026)',
    seoTitle: 'Fruver a Domicilio en Bucaramanga: Guía de Compra Fresca y Económica 2026',
    metaDescription: 'Compara supermercados, plazas de mercado y fruvers online en Bucaramanga, Floridablanca y Girón. Recibe frutas y verduras recién cosechadas en tu puerta.',
    excerpt: 'Comparativa definitiva entre supermercados de cadena, plazas tradicionales y fruvers digitales con despacho express en Bucaramanga, Floridablanca y Girón. Descubre cómo recibir cosechas recién bajadas del árbol sin pagar de más.',
    category: 'Hogar & Ahorro',
    categorySlug: 'hogar-ahorro',
    publishedAt: '2026-05-02',
    formattedDate: '02 Mayo, 2026',
    readTime: '6 min de lectura',
    author: {
      name: 'Eduard Iván Velazco',
      role: 'Fundador & Maestro Fruver en La Gaviota',
      avatar: '/IMAGES/mascota.png',
    },
    heroImage: {
      src: '/IMAGES/product-display.jpeg',
      alt: 'Variedad de frutas y verduras frescas en canastos de madera en Bucaramanga',
      caption: 'Selección de cosechas campesinas santandereanas en el punto de distribución de La Gaviota.',
    },
    tags: ['Fruver Bucaramanga', 'Mercado a Domicilio', 'Ahorro Familiar', 'Plaza San Francisco'],
    keywords: [
      'fruver a domicilio bucaramanga',
      'verduras frescas bucaramanga',
      'mercado a domicilio floridablanca',
      'plaza san francisco bucaramanga a domicilio',
      'frutas a domicilio bucaramanga',
    ],
    targetAudience: 'Hogares Santandereanos',
    sections: [
      {
        id: 'el-dilema-del-mercado',
        heading: 'El dilema del mercado semanal: ¿Supermercado de cadena, madrugón a la plaza o domicilio?',
        content: `Hacer mercado en Bucaramanga siempre ha sido un ritual de sábado o domingo por la mañana. Tradicionalmente, las familias santandereanas se han enfrentado a dos opciones polarizadas: o madrugar a las 5:00 a.m. a la Plaza San Francisco o Guarín para buscar precios de productor, o resignarse a pagar precios inflados en grandes superficies donde las verduras han pasado días almacenadas en cuartos fríos industriales.

En las cadenas de supermercados, la fruta suele pasar hasta 14 días en cadena logística nacional antes de llegar a la góndola. El resultado: tomates desabridos, aguacates golpeados que se dañan por dentro antes de madurar y hierbas deshidratadas que duran apenas dos días en el cajón de la nevera. Por otro lado, ir presencialmente a la plaza implica lidiar con tráfico en la Carrera 22 o Calle 13, problemas de parqueo, carretilleros y cargar canastas pesadas bajo el sol bumangués.`,
        callout: {
          type: 'stat',
          title: 'Dato Clave de Frescura',
          text: 'Una verdura cosechada en Lebrija o Mesa de los Santos y entregada en menos de 24 horas conserva hasta un 65% más de vitamina C y antioxidantes que un vegetal preservado en cámaras frías convencionales.',
        },
      },
      {
        id: 'herencia-san-francisco',
        heading: 'La tradición de la Plaza San Francisco con la tecnología del siglo XXI',
        content: `La Gaviota Fruver nació en el corazón comercial de Bucaramanga: el emblemático Local 10 de la Plaza de Mercado San Francisco. Durante más de cuatro décadas, hemos seleccionado mano a mano con los campesinos de Santander los mejores lotes de cítricos, tubérculos, hojas verdes y hortalizas.

Hoy esa misma experiencia artesanal está disponible a un clic de distancia. No somos intermediarios de escritorio que tercerizan el inventario: cada pedido realizado en www.lagaviotafruver.com es alistado en vivo la misma madrugada de la entrega por expertos que evalúan firmeza, peso, color y grado de madurez exacto según lo que tú prefieras.`,
        image: {
          src: '/IMAGES/slide-freshness-24h1.jpeg',
          alt: 'Verduras seleccionadas recién empacadas para entrega en Bucaramanga',
          caption: 'Cada pedido se inspecciona visualmente antes de ser embalado para despacho domiciliario.',
        },
      },
      {
        id: 'criterios-evaluacion',
        heading: '4 Criterios indispensables para elegir un fruver a domicilio confiable',
        content: `Antes de ingresar los datos de tu tarjeta o confirmar una compra de mercado online en Bucaramanga, verifica que el servicio cumpla con estos cuatro estándares de calidad:`,
        bulletPoints: [
          'Garantía de reposición inmediata ("Garantía Sí o Sí"): Si un aguacate sale negro o una papaya llega machucada por el transporte, el comercio debe reponértelo de inmediato sin trámites engorrosos ni excusas.',
          'Transparencia en el pesaje y precio por gramo: Desconfía de plataformas que redondean al alza sin especificar los gramos reales despachados.',
          'Franjas horarias de entrega predecibles: Nadie quiere estar atado en casa todo el día esperando al domiciliario. Exige ventanas de entrega claras (ej. mañana o tarde) y confirmación por WhatsApp.',
          'Cadena de frío y empaque respirable: Las bolsas plásticas selladas condensan humedad y pudren las hojas tiernas. El fruver debe utilizar empaques ventilados o bolsas de papel kraft microaireadas.',
        ],
      },
      {
        id: 'cobertura-metropolitana',
        heading: 'Cobertura total: Desde Cabecera hasta Girón y Floridablanca',
        content: `Nuestra flota propia de despachos cubre las rutas estratégicas del área metropolitana de Bucaramanga:
- Bucaramanga: Cabecera del Llano, Sotomayor, San Francisco, San Alonso, Provenza, Ciudadela Real de Minas y Centro.
- Floridablanca: Cañaveral, La Florida, Ruitoque Condominio, El Bosque y El Carmen.
- Girón: Poblado, Casco Antiguo y Rincón de Girón.

Además, los pedidos recibidos antes de las 10:00 p.m. entran en la ruta de corte para despacho al día hábil siguiente, asegurando que tus frutas no duerman en bodegas intermedias.`,
        image: {
          src: '/IMAGES/verduras-banner1.jpeg',
          alt: 'Canasta de verduras verdes y coloridas listas para reparto en Floridablanca y Bucaramanga',
          caption: 'Logística de última milla con temperatura protegida en toda el área metropolitana.',
        },
      },
    ],
    cta: {
      badge: '¡Prueba La Forma Chévere de Mercar!',
      title: 'Haz tu mercado hoy y recibe envío gratis desde $50.000',
      description: 'Selecciona tus verduras y frutas favoritas o pide nuestro Kit Chévere de la semana con garantía absoluta de frescura.',
      primaryButtonText: 'Ir a la Tienda Online',
      primaryButtonLink: '/#productos',
      secondaryButtonText: 'Pedir por WhatsApp',
      secondaryButtonLink: 'https://wa.me/573112694676?text=Hola%20La%20Gaviota,%20quiero%20hacer%20un%20pedido%20de%20mercado%20fresco',
      type: 'shop',
    },
    faqs: [
      {
        question: '¿Cuánto cuesta el domicilio en Bucaramanga y Floridablanca?',
        answer: 'En La Gaviota Fruver el domicilio es completamente GRATIS para compras superiores a $50.000 en todo el perímetro urbano de Bucaramanga y Floridablanca. Para compras menores, la tarifa es mínima y transparente ($4.000).',
      },
      {
        question: '¿Qué pasa si una fruta llega pasada o en mal estado?',
        answer: 'Contamos con nuestra política de Garantía Sí o Sí: envías una foto por WhatsApp al 311 2694676 y en tu próximo despacho te enviamos el producto de reposición sin costo alguno o te acreditamos el valor de inmediato.',
      },
      {
        question: '¿Cuáles son los medios de pago disponibles?',
        answer: 'Aceptamos Pago Contra Entrega (efectivo, Nequi, Daviplata) al recibir en tu puerta, o pago 100% seguro en línea con Wompi (tarjetas de crédito, débito y PSE).',
      },
    ],
  },
  {
    slug: 'proveedor-mayorista-frutas-verduras-restaurantes-bucaramanga',
    title: 'Proveedor mayorista de frutas y verduras para restaurantes en Bucaramanga: Guía de costos y frescura B2B',
    seoTitle: 'Proveedor Mayorista de Verduras para Restaurantes en Bucaramanga | La Gaviota B2B',
    metaDescription: 'Reduce hasta un 28% tu food cost con entregas antes de las 9:00 AM, calibres estandarizados, factura electrónica DIAN y crédito comercial a 8 y 15 días.',
    excerpt: 'Descubre cómo los mejores restaurantes de Cabecera y Cañaveral optimizan hasta un 28% su costo de materia prima (food cost) con entregas antes de las 9:00 AM, factura electrónica y crédito institucional.',
    category: 'Restaurantes & B2B',
    categorySlug: 'restaurantes-b2b',
    publishedAt: '2026-05-04',
    formattedDate: '04 Mayo, 2026',
    readTime: '8 min de lectura',
    author: {
      name: 'Chef Santiago Prada',
      role: 'Asesor Gastronómico & Operaciones B2B La Gaviota',
      avatar: '/IMAGES/mascota.png',
    },
    heroImage: {
      src: '/IMAGES/aplicar-negocio-restaurante.jpeg',
      alt: 'Chef preparando mise en place con verduras frescas de La Gaviota en cocina profesional',
      caption: 'Abastecimiento institucional para restaurantes gourmet, cafeterías y hoteles en Bucaramanga.',
    },
    tags: ['Restaurantes Bucaramanga', 'Proveedor Mayorista', 'Food Cost', 'B2B Gastronomía'],
    keywords: [
      'proveedor verduras restaurantes bucaramanga',
      'distribuidora fruver santander',
      'frutas al por mayor bucaramanga',
      'abastecimiento restaurantes cabecera',
      'verduras por mayor bucaramanga',
    ],
    targetAudience: 'Restaurantes & Hoteles',
    sections: [
      {
        id: 'el-reto-del-food-cost',
        heading: 'El dolor oculto del Food Cost: La merma por calibres dispares',
        content: `Cualquier chef ejecutivo o propietario de restaurante en el Corredor Gastronómico de Cabecera, Parque San Pío o Cañaveral conoce la pesadilla: pedir una arroba de tomate chonto o cebolla cabezona y descubrir que el 30% está demasiado maduro para corte en ensaladas, o que los calibres son tan irregulares que el rendimiento de porcionado en cocina se desploma.

Esa merma invisible es el principal devorador de los márgenes en el sector HORECA (Hoteles, Restaurantes y Catering). Cuando un restaurante compra al menudeo o a intermediarios informales de madrugada, no solo pierde tiempo enviando al auxiliar de cocina a cargar bultos; pierde dinero en mermas no cuantificadas y facturas sin soporte fiscal válido.`,
        callout: {
          type: 'warning',
          title: 'Impacto Financiero Real',
          text: 'Un restaurante con un consumo semanal de $2.500.000 en fruver puede estar perdiendo entre $350.000 y $700.000 semanales por mermas de calibre, sobremaduración y compras sin descuento institucional por volumen.',
        },
      },
      {
        id: 'entregas-antes-9am',
        heading: 'Entregas antes de las 9:00 AM: Mise en place sin estrés',
        content: `En gastronomía el tiempo es implacable. Si los vegetales llegan a las 11:30 a.m. cuando el equipo de cocina ya debe tener caldos hirviendo y cortes listos para el servicio del almuerzo, toda la operación colapsa.

En el programa B2B de La Gaviota Fruver, diseñamos una ruta logística prioritaria para establecimientos gastronómicos. Despachamos desde las 6:30 a.m. directamente desde la Plaza San Francisco con conductores asignados a zonas específicas para garantizar que la mercancía esté en la puerta de tu cocina antes de las 9:00 a.m., lista para inspección y pesado por tu jefe de cocina.`,
        image: {
          src: '/IMAGES/slide-tiered-pricing2.jpeg',
          alt: 'Matriz de precios por volumen y listas mayoristas en Bucaramanga',
          caption: 'Precios dinámicos por tiers de volumen adaptados a la capacidad operativa de tu cocina.',
        },
      },
      {
        id: 'ventajas-institucionales',
        heading: 'Los 5 Pilares de nuestro Portal B2B para Negocios',
        content: `Registrar tu establecimiento en el portal de negocios de La Gaviota te otorga beneficios de nivel corporativo:`,
        bulletPoints: [
          'Precios de Central Mayorista con tarifa fija semanal: Protegemos a tu cocina de las fluctuaciones diarias especulativas de las plazas de mercado.',
          'Facturación Electrónica DIAN automática: Factura electrónica legal y remisiones digitales con desglose de ítems, IVA cuando aplica y NIT de tu razón social.',
          'Crédito Comercial rotativo a 8 y 15 días: Apoyamos tu flujo de caja con cupos de crédito aprobados tras un estudio de 24 horas.',
          'Calibre y maduración personalizada: ¿Necesitas aguacate para hoy mismo o aguacate para madurar el fin de semana? Tu pedido se alista con especificación milimétrica de maduración.',
          'Atención VIP vía WhatsApp con Asesor de Cuenta Dedicado: Solución inmediata a pedidos de última hora o reposiciones exprés.',
        ],
      },
      {
        id: 'como-vincular-restaurante',
        heading: 'Cómo vincular tu restaurante en menos de 24 horas',
        content: `El proceso de homologación como cliente institucional es 100% digital y sin papeleos engorrosos. Solo ingresas a nuestra sección de Precios Negocio, completas el formulario con los datos de tu establecimiento (nombre comercial, NIT, ubicación y estimado de consumo) y nuestro equipo comercial te habilitará la lista de precios mayoristas con acceso a tu portal corporativo.`,
        image: {
          src: '/IMAGES/aplicar-negocio-micromercado.jpeg',
          alt: 'Micromercado y tienda gourmet abastecida con productos de alta rotación de La Gaviota',
          caption: 'También atendemos micromercados, fruterías y tiendas saludables con precios para reventa.',
        },
      },
    ],
    cta: {
      badge: 'Solución B2B para Gastronomía',
      title: 'Aplica a Precios Institucionales y Recibe tu Cotización Hoy',
      description: 'Únete a más de 45 restaurantes y negocios en Bucaramanga que confían su abastecimiento diario a La Gaviota.',
      primaryButtonText: 'Aplicar como Negocio',
      primaryButtonLink: '/aplicar-negocio',
      secondaryButtonText: 'Hablar con Asesor B2B',
      secondaryButtonLink: 'https://wa.me/573112694676?text=Hola,%20tengo%20un%20restaurante%20en%20Bucaramanga%20y%20quiero%20cotizar%20precios%20mayoristas',
      type: 'b2b',
    },
    faqs: [
      {
        question: '¿Cuál es el pedido mínimo para acceder a precios de restaurante?',
        answer: 'El pedido mínimo para tarifas mayoristas B2B es de tan solo $80.000 por despacho, con envío prioritario antes de las 9:00 AM.',
      },
      {
        question: '¿Cómo funciona el crédito a 8 y 15 días?',
        answer: 'Realizamos las dos primeras compras de contado o contraentrega para validar consumos. A partir del tercer pedido, habilitamos la línea de crédito semanal o quincenal contra presentación de RUT y cédula del representante legal.',
      },
      {
        question: '¿Eiten factura electrónica válida para deducir costos ante la DIAN?',
        answer: 'Sí, todas las órdenes institucionales se emiten con Factura Electrónica conforme a las regulaciones de la DIAN, enviadas automáticamente al buzón tributario de tu empresa.',
      },
    ],
  },
  {
    slug: 'kit-chevere-mercado-semanal-ahorro-familias-santandereanas',
    title: 'Kit Chévere: Cómo ahorrar hasta un 35% en tu mercado semanal en Bucaramanga sin perder frescura',
    seoTitle: 'Kit Chévere de Mercado en Bucaramanga: Ahorro Semanal Garantizado | La Gaviota',
    metaDescription: 'Descubre el Kit Chévere de La Gaviota: una canasta balanceada de frutas, verduras y tubérculos frescos con entrega a domicilio y ahorro real para tu hogar.',
    excerpt: 'Analizamos por qué el Kit Chévere rotativo de La Gaviota se convirtió en el producto favorito de las familias en Bucaramanga y Floridablanca: variedad balanceada, cero merma y precio fijo blindado contra la inflación.',
    category: 'Hogar & Ahorro',
    categorySlug: 'hogar-ahorro',
    publishedAt: '2026-05-05',
    formattedDate: '05 Mayo, 2026',
    readTime: '5 min de lectura',
    author: {
      name: 'María Alejandra Gómez',
      role: 'Especialista en Nutrición & Economía Doméstica',
      avatar: '/IMAGES/mascota.png',
    },
    heroImage: {
      src: '/IMAGES/kit-chevere-semana.jpg',
      alt: 'Caja con variedad de verduras, papas, frutas y plátanos del Kit Chévere La Gaviota',
      caption: 'El Kit Chévere reúne los productos esenciales de la canasta familiar santandereana al mejor precio de la región.',
    },
    tags: ['Kit Chévere', 'Ahorro Mercado', 'Mercado Bucaramanga', 'Canasta Familiar'],
    keywords: [
      'kit de mercado bucaramanga',
      'mercado campesino santander',
      'canasta familiar barata bucaramanga',
      'mercado a domicilio sin intermediarios',
      'ahorro mercado bucaramanga',
    ],
    targetAudience: 'Hogares Santandereanos',
    sections: [
      {
        id: 'que-es-el-kit-chevere',
        heading: '¿Qué es exactamente el Kit Chévere y por qué todo el mundo habla de él?',
        content: `El Kit Chévere nació como una respuesta directa a una queja recurrente de los hogares santandereanos: "Cuando voy a mercar termino comprando de más y la mitad de las verduras se me pudre en la nevera, o termino gastando más de $120.000 en cosas que no necesitaba".

El Kit Chévere es una canasta inteligente curada semanalmente por nuestros especialistas de La Gaviota. Agrupa de manera armónica los ingredientes fundamentales para alimentar a una familia de 3 a 5 personas durante una semana completa, combinando tubérculos de alta duración, verduras de ensalada, aliños tradicionales y frutas frescas para jugos y consumo diario.`,
        callout: {
          type: 'tip',
          title: 'Ahorro Comprobado',
          text: 'Comprar los mismos ítems del Kit Chévere por separado en un supermercado tradicional cuesta un 35% más debido a los márgenes comerciales de empaque individual y exhibición.',
        },
      },
      {
        id: 'que-incluye-la-canasta',
        heading: 'Anatomía de un Kit Chévere: ¿Qué encuentras adentro?',
        content: `Aunque los productos rotan ligeramente según la cosecha semanal de los municipios vecinos, la base estructural del Kit Chévere siempre asegura variedad nutricional:`,
        bulletPoints: [
          'Básicos de Sazón Santandereana: Tomate chonto maduro y pintón, cebolla junca (larga), cebolla cabezona roja y blanca, cilantro fresco campesino y ajos seleccionados.',
          'Tubérculos & Carbohidratos Nobles: Papa pastusa seleccionada para sopa, papa criolla dorada, plátano verde para patacón y plátano maduro meloso.',
          'Hortalizas Crujientes de Ensalada: Zanahoria dulce, lechuga crespa hidropónica, pepino cohombro y pimentón rojo carnoso de la Mesa de los Santos.',
          'Frutas Dulces & Cítricos: Aguacate papelillo en punto perfecto, limón tahití con abundante jugo, maracuyá de Lebrija y fruta de temporada (papaya, lulo o mango).',
        ],
        image: {
          src: '/IMAGES/Canvas_market_tote_202603260917.jpeg',
          alt: 'Bolsa tote de mercado ecológico con frutas y verduras frescas de Santander',
          caption: 'Empaque protegido y sostenible que conserva la frescura durante todo el trayecto de despacho.',
        },
      },
      {
        id: 'garantia-si-o-si',
        heading: 'La Garantía "Sí o Sí": Comprar fruver por internet sin miedo',
        content: `El principal temor al pedir verduras por internet es: "¿Y si me mandan lo que nadie quiso comprar en el almacén?". En La Gaviota operamos bajo una filosofía opuesta: el cliente digital recibe lo mejor de la cosecha.

Por eso instituimos la Garantía "Sí o Sí". Si al desempacar tu Kit Chévere encuentras un producto que no cumple con tus expectativas de frescura o que sufrió un golpe durante el viaje, nos escribes un mensaje por WhatsApp con una foto y en tu próxima entrega te llevamos la reposición con creces o te reembolsamos el valor proporcional inmediatamente. Cero papeleos.`,
      },
      {
        id: 'comparativa-presupuesto',
        heading: 'Cómo planificar tu presupuesto familiar mensual de mercado',
        content: `Organizar las compras con Kits semanales te permite tener previsibilidad financiera total. Muchas familias en Cabecera, Provenza y Cañaveral programan su pedido de Kit Chévere para entrega todos los martes o sábados, eliminando compras compulsivas y ahorrando hasta $250.000 al mes en la canasta familiar básica.`,
        image: {
          src: '/IMAGES/kit-chevere-semana2.jpeg',
          alt: 'Familia disfrutando de alimentos frescos preparados con el Kit Chévere en Bucaramanga',
          caption: 'Comida casera deliciosa, sana y económica para compartir en la mesa familiar.',
        },
      },
    ],
    cta: {
      badge: 'El Favorito de Santander',
      title: 'Pide tu Kit Chévere de la Semana con Despacho a Domicilio',
      description: 'Lleva la canasta más fresca y completa de Bucaramanga con garantía absoluta de calidad a tu hogar.',
      primaryButtonText: 'Ver Kit Chévere en la Tienda',
      primaryButtonLink: '/#productos',
      secondaryButtonText: 'Consultar por WhatsApp',
      secondaryButtonLink: 'https://wa.me/573112694676?text=Hola,%20quiero%20pedir%20el%20Kit%20Chévere%20de%20esta%20semana',
      type: 'kit',
    },
    faqs: [
      {
        question: '¿Puedo cambiar algún producto del Kit si no me gusta?',
        answer: '¡Por supuesto! En las notas del pedido antes de finalizar o escribiéndonos por WhatsApp puedes solicitar sustituciones equivalentes (por ejemplo: cambiar pepino por más zanahoria o plátano verde por maduro).',
      },
      {
        question: '¿Cuántos días dura fresco el contenido del Kit?',
        answer: 'Gracias a que los productos son cosechados y empacados el mismo día del despacho, las hojas verdes duran más de 7 días y los tubérculos y cítricos más de 15 días siguiendo nuestras recomendaciones de conservación.',
      },
    ],
  },
  {
    slug: 'calendario-cosechas-temporada-frutas-verduras-santander',
    title: 'Calendario de Cosechas en Santander: Frutas y verduras de temporada para comer más rico y barato',
    seoTitle: 'Calendario de Cosechas en Santander: Guía Estacional de Frutas y Verduras | La Gaviota',
    metaDescription: 'Descubre qué meses comprar piña de Lebrija, aguacate de San Vicente, mora de Tona y cítricos del Rionegro en su punto máximo de dulzura y al mejor precio.',
    excerpt: 'Guía estacional del campo santandereano. Aprende en qué meses comprar piña de Lebrija, aguacate de San Vicente, mora de Tona y cítricos del Rionegro en su punto máximo de dulzura y al menor precio.',
    category: 'Temporada & Cosechas',
    categorySlug: 'temporada-cosechas',
    publishedAt: '2026-05-06',
    formattedDate: '06 Mayo, 2026',
    readTime: '7 min de lectura',
    author: {
      name: 'Ing. Carlos Julio Serrano',
      role: 'Agrónomo Enlace Campesino La Gaviota',
      avatar: '/IMAGES/mascota.png',
    },
    heroImage: {
      src: '/IMAGES/slide-santander-pride.jpeg',
      alt: 'Agricultores santandereanos cosechando frutos frescos en las montañas de Santander',
      caption: 'El campo de Santander es una despensa inagotable de microclimas fértiles y productos excepcionales.',
    },
    tags: ['Cosechas Santander', 'Frutas de Temporada', 'Campo Santandereano', 'Aguacate Papelillo'],
    keywords: [
      'frutas de temporada santander',
      'aguacate papelillo santander',
      'limon tahiti bucaramanga',
      'pina lebrija temporada',
      'cosechas santander 2026',
      'frutas baratas bucaramanga',
    ],
    targetAudience: 'General',
    sections: [
      {
        id: 'la-magia-de-la-temporada',
        heading: 'Por qué comer con las estaciones del campo santandereano cambia tu salud y tu bolsillo',
        content: `Santander goza de una bendición geográfica única: en un radio de menos de 80 kilómetros alrededor de Bucaramanga conviven el calor tropical de Lebrija y San Vicente de Chucurí, el clima templado y seco de la Mesa de los Santos y Girón, y el frío paramuno de Tona, Berlín y Pamplona.

Cuando compras una fruta en su pico natural de cosecha, la planta ha completado su ciclo biológico con abundante sol y nutrientes de la tierra. La fruta no requiere aceleradores químicos de maduración ni aditivos; su pulpa alcanza los grados brix (dulzura natural) más elevados y los precios bajan notablemente por abundancia de oferta en la Plaza San Francisco.`,
        callout: {
          type: 'quote',
          title: 'Sabiduría Popular Santandereana',
          text: '"El que come la fruta en su tiempo, come miel a precio de centavo". Aprovechar los picos estacionales es la regla de oro de las mejores cocineras tradicionales bumanguesas.',
        },
      },
      {
        id: 'calendario-trimestre',
        heading: 'Guía Estacional Cuatrimestre a Cuatrimestre en Santander',
        content: `Conoce las épocas doradas de los productos más emblemáticos de nuestra región:`,
        bulletPoints: [
          'Primer Cuatrimestre (Enero a Abril) — Cítricos, Guanábana y Melón: Temporada alta de naranja valencia de Rionegro, mandarina arrayana jugosa, limón pajarito y guanábana gigante de Lebrija. Época ideal para jugos hidratantes y batidos verdes.',
          'Segundo Cuatrimestre (Mayo a Agosto) — El Reinado del Aguacate y la Piña Oro Miel: Pico de aguacate papelillo liso y brillante procedente de San Vicente y Santa Bárbara, junto con la legendaria piña perolera y manzana de Lebrija.',
          'Tercer Cuatrimestre (Septiembre a Diciembre) — Hortalizas de Páramo y Frutas Especiales: Cosechas abundantes de mora de castilla de Tona, fresa de Berlín, lulo chocoano, tomate de árbol y pimentones gruesos de la Mesa de los Santos.',
        ],
        image: {
          src: '/IMAGES/frutas-banner1.jpeg',
          alt: 'Exhibición de frutas tropicales colombianas llenas de color y dulzura',
          caption: 'Frutas seleccionadas directamente en los centros de acopio campesinos de la región.',
        },
      },
      {
        id: 'impacto-economico',
        heading: 'El impacto económico: Hasta un 50% de diferencia en el recibo final',
        content: `Un kilogramo de aguacate papelillo o limón tahití en temporada de escasez puede duplicar su precio debido a la importación desde otros departamentos como el Eje Cafetero o Antioquia. Al comprar fruta local en su calendario nativo, el flete es mínimo y el ahorro se traslada de inmediato al precio final que pagas en La Gaviota.`,
      },
      {
        id: 'conexion-con-el-campesino',
        heading: 'Comercio justo directo con las veredas santandereanas',
        content: `En La Gaviota Fruver trabajamos directamente con más de 25 familias productoras de las veredas El Tablazo (Lebrija), Los Santos, El Carmen de Chucurí y Santa Rosa. Al comprar en nuestra plataforma, apoyas un modelo de precio justo que remunera con dignidad el trabajo del campesino santandereano.`,
        image: {
          src: '/IMAGES/about-granja-mesa3.jpeg',
          alt: 'Cultivo agrícola en la Mesa de los Santos con técnicas de riego limpio',
          caption: 'Siembras tecnificadas y riego con aguas limpias en las altas mesetas de Santander.',
        },
      },
    ],
    cta: {
      badge: 'Orgullo Santandereano',
      title: 'Disfruta las Frutas en su Máximo Grado de Madurez',
      description: 'Explora nuestra sección de frutas de temporada bajadas del árbol directo a tu mesa en Bucaramanga.',
      primaryButtonText: 'Explorar Frutas Frescas',
      primaryButtonLink: '/#productos',
      secondaryButtonText: 'Consultar Cosechas por WhatsApp',
      secondaryButtonLink: 'https://wa.me/573112694676?text=Hola,%20quisiera%20saber%20qué%20frutas%20de%20temporada%20tienen%20disponibles%20hoy',
      type: 'shop',
    },
    faqs: [
      {
        question: '¿Por qué la piña de Lebrija es tan famosa en Colombia?',
        answer: 'El suelo arenoso y el choque térmico entre la brisa del cañón y la humedad de la serranía concentran azúcares de manera única en Lebrija, considerada la capital piñera de Colombia. En La Gaviota la recibimos con menos de 24 horas de cortada.',
      },
      {
        question: '¿Cómo sé si el aguacate que compro está listo para comer?',
        answer: 'En La Gaviota puedes indicar en las notas de tu pedido si prefieres aguacate "para hoy mismo" (cremoso y listo para servir) o "para el fin de semana" (firme y de maduración paulatina).',
      },
    ],
  },
  {
    slug: 'guia-conservacion-frutas-verduras-clima-bucaramanga',
    title: 'El secreto de la Plaza San Francisco: Cómo conservar tus verduras frescas por más de 12 días en Bucaramanga',
    seoTitle: 'Cómo Conservar Verduras Frescas en Bucaramanga y Clima Cálido | La Gaviota',
    metaDescription: 'Aprende 7 trucos profesionales para evitar que el calor y la humedad de Bucaramanga y Girón pudran tus verduras. Duplica la vida de tu mercado.',
    excerpt: 'El clima cálido y la humedad de Bucaramanga y Girón pueden acelerar la descomposición de tus vegetales. Aplica estos 7 trucos profesionales de almacenamiento para duplicar la vida de tu mercado.',
    category: 'Tips de Frescura',
    categorySlug: 'tips-frescura',
    publishedAt: '2026-05-08',
    formattedDate: '08 Mayo, 2026',
    readTime: '6 min de lectura',
    author: {
      name: 'Eduard Iván Velazco',
      role: 'Fundador & Maestro Fruver en La Gaviota',
      avatar: '/IMAGES/mascota.png',
    },
    heroImage: {
      src: '/IMAGES/verduras-banner2.jpeg',
      alt: 'Verduras frescas crujientes organizadas perfectamente en cajón de refrigerador',
      caption: 'Una adecuada técnica de almacenamiento prolonga la frescura y nutrientes de tus hortalizas.',
    },
    tags: ['Tips de Cocina', 'Conservación de Alimentos', 'Hogar Bucaramanga', 'Cero Desperdicio'],
    keywords: [
      'como conservar verduras en bucaramanga',
      'refrigerar verduras clima calido',
      'como guardar aguacate papelillo',
      'conservar hierbas frescas',
      'trucos para conservar cilantro bucaramanga',
    ],
    targetAudience: 'Hogares Santandereanos',
    sections: [
      {
        id: 'el-enemigo-humedad',
        heading: '1. El error común: Dejar las verduras en las bolsas plásticas del mercado',
        content: `Bucaramanga tiene una temperatura promedio que oscila entre los 23°C y 28°C con una humedad relativa superior al 75%. Cuando dejas tus verduras dentro de las bolsas plásticas delgadas en las que te las entregaron, las plantas siguen respirando y transpirando vapor de agua.

Esa condensación queda atrapada contra la piel de las hojas y en cuestión de 48 horas genera proliferación de bacterias y hongos que vuelven baboso el cilantro y la espinaca. Tan pronto llegue tu pedido de La Gaviota, saca las verduras de las bolsas, sécalas suavemente con un paño limpio y colócalas en recipientes con servilletas absorbentes.`,
        callout: {
          type: 'tip',
          title: 'El Secreto del Cilantro Perfecto',
          text: 'Trata al cilantro como si fuera un ramo de flores: corta un centímetro de la base de los tallos, mételos en un vaso con dos dedos de agua limpia y cubre las hojas con una bolsa holgada en la puerta de la nevera. ¡Durará crujiente hasta por 14 días!',
        },
      },
      {
        id: 'el-gas-etileno',
        heading: '2. Separa los emisores de etileno de los alimentos sensibles',
        content: `El etileno es una hormona vegetal en forma de gas que producen ciertas frutas durante su proceso de maduración. Si pones una fruta con alto etileno junto a verduras sensibles, acelerarás su envejecimiento prematuro:`,
        bulletPoints: [
          'Productores altos de etileno (mantener aislados): Plátanos maduros, manzanas, tomates y maracuyá.',
          'Alimentos hipersensibles al etileno (mantener lejos): Lechugas, pepinos cohombro, zanahorias, hierbas aromáticas y papas.',
          'Regla de oro: Nunca guardes papas y cebollas en el mismo canasto. El gas de la cebolla hace que la papa brote raíces amargas rápidamente.',
        ],
        image: {
          src: '/IMAGES/slide-freshness-24h.jpeg',
          alt: 'Canastilla ventilada con frutas y verduras organizadas por categorías',
          caption: 'La ventilación y correcta separación evitan la fermentación prematura de los productos.',
        },
      },
      {
        id: 'que-va-a-la-nevera',
        heading: '3. La lista definitiva: ¿Qué va a la nevera y qué vive afuera en Bucaramanga?',
        content: `Muchos alimentos pierden sabor, textura y nutrientes cuando se someten al frío excesivo:
- NUNCA a la nevera: Tomate chonto (el frío destruye sus membranas y lo vuelve harinoso), plátano verde (el frío no lo deja madurar), papas y ajos (el frío convierte el almidón en azúcar y los pudre). Deben vivir en una canastilla ventilada y en sombra fresca.
- SIEMPRE a la nevera (en el cajón inferior de verduras): Lechugas, espinacas, zanahorias (sin sus hojas verdes superiores para que no le roben agua a la raíz), apio, brócoli y fresas.`,
      },
      {
        id: 'el-caso-del-aguacate',
        heading: '4. Cómo dominar el punto del aguacate papelillo santandereano',
        content: `El aguacate papelillo es apreciado por su cáscara fina y su textura sedosa, pero es delicado. Déjalo madurar a temperatura ambiente sobre el mesón de la cocina. En el momento exacto en que ceda ligeramente a la suave presión de la yema de tu dedo pulgar cerca al pedúnculo, mételo al refrigerador. El frío detendrá la maduración y se mantendrá en ese punto sublime por 3 a 4 días adicionales sin ponerse negro.`,
        image: {
          src: '/IMAGES/Canvas_tote_bag_202603260850.jpeg',
          alt: 'Bolsa de tela de mercado con vegetales frescos listos para almacenar',
          caption: 'Utilizar empaques textiles y aireados previene la transpiración excesiva de las hortalizas.',
        },
      },
    ],
    cta: {
      badge: 'Cero Desperdicio en Casa',
      title: 'Pide Verduras Frescas con Calidad de Plaza San Francisco',
      description: 'Llevamos a tu puerta cosechas seleccionadas con empaque óptimo para que duren mucho más en tu hogar.',
      primaryButtonText: 'Armar Mi Mercado',
      primaryButtonLink: '/#productos',
      secondaryButtonText: 'Pedir Asistencia por WhatsApp',
      secondaryButtonLink: 'https://wa.me/573112694676?text=Hola,%20leí%20la%20guía%20de%20conservación%20y%20quiero%20hacer%20un%20pedido%20fresco',
      type: 'shop',
    },
    faqs: [
      {
        question: '¿Debo lavar las verduras inmediatamente al recibirlas?',
        answer: 'Solo lava lo que vayas a consumir el mismo día. La humedad del lavado sobre las hojas y frutas crea microclimas que aceleran hongos en la nevera. Lávalas y desinféctalas con agua y vinagre blanco justo antes de picar y cocinar.',
      },
      {
        question: '¿Qué empaque utiliza La Gaviota para sus despachos?',
        answer: 'Utilizamos cajas ventiladas y bolsas transpirables que protegen los vegetales de golpes durante el transporte en moto o furgón y evitan la condensación térmica en los días calurosos.',
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getRelatedBlogPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getBlogPostBySlug(currentSlug);
  if (!currentPost) return BLOG_POSTS.slice(0, limit);

  // Filter out current post
  const others = BLOG_POSTS.filter((p) => p.slug !== currentSlug);

  // Prioritize same category, then general
  const sameCategory = others.filter((p) => p.category === currentPost.category);
  const differentCategory = others.filter((p) => p.category !== currentPost.category);

  return [...sameCategory, ...differentCategory].slice(0, limit);
}
