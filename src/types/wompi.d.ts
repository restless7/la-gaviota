export interface WompiWidgetResult {
  transaction?: { status?: string };
}

declare global {
  interface Window {
    WidgetCheckout?: new (options: Record<string, unknown>) => {
      open: (callback: (result: WompiWidgetResult) => void) => void;
    };
  }
}
