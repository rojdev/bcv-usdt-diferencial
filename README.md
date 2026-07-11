# VeneRate - Monitoreo de Diferencial Cambiario

VeneRate es una aplicación web responsiva e interactiva de alta gama diseñada para visualizar, analizar y calcular el diferencial cambiario (brecha) entre las tasas oficiales del Banco Central de Venezuela (Dólar BCV y Euro BCV) y el mercado de criptomonedas (USDT en Binance P2P).

## 🚀 Características

- **Cotizaciones en Tiempo Real**: Consumo en vivo de las APIs de DolarApi.com (para tasas del BCV) y CriptoYa.com (para la cotización del USDT Binance P2P).
- **Cálculo de Brechas (Spreads)**: Muestra el porcentaje y valor absoluto del diferencial cambiario entre el dólar/euro oficial y el USDT cripto.
- **Gráfica Comparativa Interactiva**: Gráfica de barras moderna alimentada por **Chart.js** con estilos premium y adaptados al tema oscuro.
- **Calculadora Multidivisa Inteligente**: Convierte entre USD, EUR, USDT y VES de manera dinámica utilizando las tasas actuales, ofreciendo un desglose del "ahorro" o "pérdida" en comparación con la tasa oficial.
- **Auto-Actualización**: Contador regresivo de 60 segundos para refrescar automáticamente los datos sin recargar la página.
- **Interfaz Premium**: Diseño visual de alta gama con estilo Glassmorphism, degradados modernos, sombras suaves y optimizado para dispositivos móviles y de escritorio.

## 🛠️ Tecnologías Utilizadas

- **Estructura**: HTML5 Semántico.
- **Estilos**: Vanilla CSS con variables personalizadas y animaciones integradas.
- **Lógica**: JavaScript (ES6) nativo.
- **Visualización**: Chart.js (vía CDN).
- **Iconografía**: FontAwesome.
- **Servicio de Hosting**: Vercel.

## 📂 Estructura del Proyecto

```bash
bcv-usdt-diferencial/
├── index.html       # Interfaz principal de la aplicación web
├── style.css        # Estilos visuales de alta gama (Glassmorphism, responsividad)
├── app.js           # Lógica, consumo de APIs, calculadora y gráficas
└── README.md        # Documentación del proyecto
```

## 🌐 APIs Consumidas

1. **DolarApi (Venezuela)**: `https://ve.dolarapi.com/v1/dolares/oficial` y `https://ve.dolarapi.com/v1/euros/oficial`
2. **CriptoYa (Binance P2P)**: `https://criptoya.com/api/binancep2p/usdt/ves`
