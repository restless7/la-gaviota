#!/bin/bash

# ==============================================================================
# La Gaviota OS - Wompi Production Deployment Script
# Orchestrator: Freya (Mission Control)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}🚀 INICIANDO PROTOCOLO DE DESPLIEGUE A PRODUCCIÓN: WOMPI${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null
then
    echo -e "${RED}[ERROR] Vercel CLI no está instalado. Por favor instala usando: npm i -g vercel${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Paso 1: Recolección de Credenciales de Producción${NC}"
echo "Por favor, ingresa las credenciales obtenidas de tu consola Wompi (Entorno: Producción)."

read -p "🔹 NEXT_PUBLIC_WOMPI_PUB_KEY (Debe empezar con pub_prod_): " pub_prod_key
read -s -p "🔹 WOMPI_PRV_KEY (Debe empezar con prv_prod_): " prv_prod_key
echo ""
read -s -p "🔹 WOMPI_INTEGRITY_SECRET (Secreto de Integridad): " integrity_secret
echo ""
read -s -p "🔹 WOMPI_EVENTS_SECRET (Secreto de Eventos/Webhook): " events_secret
echo ""

# Validaciones de seguridad básicas
if [[ ! "$pub_prod_key" == pub_prod_* ]]; then
    echo -e "${RED}[ERROR] La llave pública debe comenzar con 'pub_prod_'.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Paso 2: Inyección Segura de Entorno en Vercel${NC}"
echo -e "Estableciendo Aislamiento de Secretos..."

# Public Variable (Client-side)
echo -e "➜ Configurando NEXT_PUBLIC_WOMPI_PUB_KEY (Accesible por el cliente)..."
echo -n "$pub_prod_key" | vercel env add NEXT_PUBLIC_WOMPI_PUB_KEY production

# Private Variables (Server-side only)
echo -e "➜ Configurando WOMPI_PRV_KEY (Aislada en Servidor)..."
echo -n "$prv_prod_key" | vercel env add WOMPI_PRV_KEY production

echo -e "➜ Configurando WOMPI_INTEGRITY_SECRET (Aislada en Servidor)..."
echo -n "$integrity_secret" | vercel env add WOMPI_INTEGRITY_SECRET production

echo -e "➜ Configurando WOMPI_EVENTS_SECRET (Aislada en Servidor)..."
echo -n "$events_secret" | vercel env add WOMPI_EVENTS_SECRET production

echo -e "${GREEN}✓ Inyección completada exitosamente.${NC}"

echo -e "\n${YELLOW}Paso 3: Verificación del Endpoint del Webhook${NC}"
WEBHOOK_URL="https://www.lagaviotafruver.com/api/webhooks/wompi"

echo -e "${RED}⚠️  ATENCIÓN REQUERIDA EN LA CONSOLA DE WOMPI ⚠️${NC}"
echo -e "Debes asegurar que Wompi esté enviando los eventos a la ruta exacta."
echo -e "1. Ve al Dashboard de Wompi Producción > Desarrolladores > Webhooks."
echo -e "2. Asegúrate de que la URL registrada sea EXACTAMENTE:"
echo -e "   ${BLUE}${WEBHOOK_URL}${NC}"
echo -e "3. Asegúrate de que el evento 'transaction.updated' esté marcado."

read -p "¿Confirma que la URL en Wompi coincide exactamente con la mostrada arriba? (s/n): " confirm_url

if [[ "$confirm_url" != "s" && "$confirm_url" != "S" ]]; then
    echo -e "${RED}[ABORTADO] Debes actualizar la URL en Wompi antes de continuar.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Paso 4: Prueba Ping al Webhook${NC}"
echo -e "Verificando conectividad básica con el endpoint de producción..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" -X POST $WEBHOOK_URL)

# Since we are sending an empty POST it should fail with 4xx, but the endpoint must be reachable.
if [[ "$HTTP_STATUS" == "000" ]]; then
    echo -e "${RED}[ALERTA] No se pudo establecer conexión HTTP con el dominio. Verifica la propagación DNS.${NC}"
else
    echo -e "${GREEN}✓ Conectividad verificada (Código de respuesta base: $HTTP_STATUS).${NC}"
fi

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${GREEN}✨ PROTOCOLO DE DESPLIEGUE FINALIZADO CON ÉXITO ✨${NC}"
echo -e "Puedes proceder a generar un nuevo Deployment en Vercel para que los cambios de variables surtan efecto:"
echo -e "   ${YELLOW}vercel --prod${NC}"
echo -e "${BLUE}======================================================${NC}"
