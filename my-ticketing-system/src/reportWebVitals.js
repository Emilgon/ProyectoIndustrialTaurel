/**
 * Reporta las métricas vitales web a una función de devolución de llamada.
 * Utiliza la librería `web-vitals` para obtener métricas como CLS, FID, FCP, LCP y TTFB.
 * @param {function} onPerfEntry - La función de devolución de llamada que se ejecutará con cada métrica de rendimiento.
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
