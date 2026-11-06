import { Order, OrderItem } from '@/src/actions/orders';

export type LifeCycleStageKey = 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface LifeCycleStage {
  key: LifeCycleStageKey;
  stepNumber: number;
  label: string;
  sublabel: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming' | 'cancelled';
  icon: 'clock' | 'package' | 'truck' | 'check' | 'alert';
}

export interface ActiveOrderTrackingDetails {
  orderId: string;
  displayNumber: string;
  rawStatus: Order['status'];
  paymentStatus: string;
  isLive: boolean;
  isCancelled: boolean;
  isDelivered: boolean;
  currentStepIndex: number; // 0 to 3
  progressPercent: number; // 0 to 100
  stages: LifeCycleStage[];
  statusBadge: {
    label: string;
    classes: string;
    icon: 'clock' | 'package' | 'truck' | 'check' | 'alert';
  };
  scheduledDeliveryDate: string | null;
  deliveryWindow: string;
  destination: {
    recipientName: string;
    city: string;
    address: string;
    phone: string;
  };
  financialSummary: {
    totalAmount: number;
    paymentMethod: string;
    isPaid: boolean;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  createdAt: string;
  supportWhatsAppUrl: string;
}

export const ORDER_LIFECYCLE_STAGES: Array<{
  key: LifeCycleStageKey;
  stepNumber: number;
  label: string;
  sublabel: string;
  operationalDescription: string;
  icon: 'clock' | 'package' | 'truck' | 'check';
}> = [
  {
    key: 'CONFIRMED',
    stepNumber: 1,
    label: 'Pedido Confirmado',
    sublabel: 'Recepción y validación',
    operationalDescription: 'Tu pedido fue recibido y registrado exitosamente en el sistema operativo de La Gaviota.',
    icon: 'clock',
  },
  {
    key: 'PREPARING',
    stepNumber: 2,
    label: 'Alistamiento en Bodega',
    sublabel: 'Selección y empaque',
    operationalDescription: 'Nuestros operarios en la Plaza San Francisco están pesando, seleccionando y embalando las frutas y verduras más frescas.',
    icon: 'package',
  },
  {
    key: 'IN_TRANSIT',
    stepNumber: 3,
    label: 'En Camino',
    sublabel: 'Despacho y reparto',
    operationalDescription: 'Tu pedido ya salió de bodega y va en ruta con nuestro transportador rumbo a tu dirección.',
    icon: 'truck',
  },
  {
    key: 'DELIVERED',
    stepNumber: 4,
    label: 'Entregado',
    sublabel: 'Entrega a satisfacción',
    operationalDescription: 'Pedido entregado en tu puerta. ¡Gracias por mercar fresco y local con Surtifruver La Gaviota!',
    icon: 'check',
  },
];

export function computeOrderLifeCycle(order: Order): ActiveOrderTrackingDetails {
  const isCancelled = order.status === 'Cancelado';
  const isDelivered = order.status === 'Entregado' || order.status === 'ARCHIVED_DELIVERED';
  const isLive = !isCancelled && !isDelivered;

  let currentStepIndex = 0;
  let progressPercent = 25;

  switch (order.status) {
    case 'Pago Pendiente':
      currentStepIndex = 0;
      progressPercent = 15;
      break;
    case 'Pendiente':
      currentStepIndex = 0;
      progressPercent = 25;
      break;
    case 'En Preparación':
      currentStepIndex = 1;
      progressPercent = 55;
      break;
    case 'En Ruta':
      currentStepIndex = 2;
      progressPercent = 85;
      break;
    case 'Entregado':
    case 'ARCHIVED_DELIVERED':
      currentStepIndex = 3;
      progressPercent = 100;
      break;
    case 'Cancelado':
      currentStepIndex = -1;
      progressPercent = 0;
      break;
  }

  const stages: LifeCycleStage[] = ORDER_LIFECYCLE_STAGES.map((def, idx) => {
    let state: LifeCycleStage['state'] = 'upcoming';

    if (isCancelled) {
      state = 'cancelled';
    } else if (idx < currentStepIndex) {
      state = 'completed';
    } else if (idx === currentStepIndex) {
      state = 'current';
    } else {
      state = 'upcoming';
    }

    return {
      key: def.key,
      stepNumber: def.stepNumber,
      label: def.label,
      sublabel: def.sublabel,
      description: def.operationalDescription,
      state,
      icon: def.icon,
    };
  });

  const getStatusBadge = () => {
    if (isCancelled) {
      return {
        label: 'Cancelado',
        classes: 'bg-red-50 text-red-700 border-red-200',
        icon: 'alert' as const,
      };
    }
    switch (order.status) {
      case 'Pago Pendiente':
        return {
          label: 'Pago Pendiente',
          classes: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: 'clock' as const,
        };
      case 'Pendiente':
        return {
          label: 'Confirmado en Espera',
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: 'clock' as const,
        };
      case 'En Preparación':
        return {
          label: 'Alistando en Bodega',
          classes: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: 'package' as const,
        };
      case 'En Ruta':
        return {
          label: 'En Ruta de Entrega',
          classes: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: 'truck' as const,
        };
      case 'Entregado':
      case 'ARCHIVED_DELIVERED':
        return {
          label: 'Entregado',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: 'check' as const,
        };
      default:
        return {
          label: order.status,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: 'clock' as const,
        };
    }
  };

  const deliveryWindow = order.scheduled_delivery_date
    ? `Entrega programada: ${new Date(order.scheduled_delivery_date + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })} (Jornada Mañana: 6:00 AM - 1:00 PM)`
    : 'Jornada estimada: 6:00 AM - 1:00 PM (Próxima ruta)';

  const displayNumber = `#LG-${order.id.slice(0, 8).toUpperCase()}`;

  const formattedTotal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(order.total_amount);

  const whatsappMessage = encodeURIComponent(
    `Hola Surtifruver La Gaviota 🧺, consulto por favor el estado de mi pedido ${displayNumber} (${order.status}) a nombre de ${order.customer_name} por valor de ${formattedTotal}. ¡Gracias!`
  );
  const supportWhatsAppUrl = `https://wa.me/573112694676?text=${whatsappMessage}`;

  return {
    orderId: order.id,
    displayNumber,
    rawStatus: order.status,
    paymentStatus: order.payment_status || 'contra_entrega',
    isLive,
    isCancelled,
    isDelivered,
    currentStepIndex,
    progressPercent,
    stages,
    statusBadge: getStatusBadge(),
    scheduledDeliveryDate: order.scheduled_delivery_date || null,
    deliveryWindow,
    destination: {
      recipientName: order.customer_name || 'Cliente',
      city: order.delivery_municipality || 'Bucaramanga',
      address: order.delivery_address || 'Dirección no especificada',
      phone: order.customer_phone || '',
    },
    financialSummary: {
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method || 'contra_entrega',
      isPaid: order.payment_status === 'APPROVED' || order.payment_status === 'PAGADO',
    },
    items: (order.order_items || []).map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price_at_purchase) || 0,
      subtotal: (Number(item.quantity) || 1) * (Number(item.price_at_purchase) || 0),
    })),
    createdAt: order.created_at,
    supportWhatsAppUrl,
  };
}

