import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { collection, query, getDocs, getFirestore, db, getDoc, updateDoc, doc, deleteDoc, where, onSnapshot } from "../firebaseConfig";
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth"; // Asegúrate de importar getAuth


// Componentes de Material-UI
import {
  Grid, Card, CardContent, Typography, CircularProgress,
  ButtonGroup, Button, Box, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Popover,
  IconButton, Tooltip, Snackbar, Alert, TableBody,
  TableCell, TableHead, Table, Paper, TableRow,
  TableContainer
} from '@mui/material';

// Iconos de Material-UI
import {
  Search as SearchIcon,
  Logout as LogoutIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  DonutLarge as DoughnutIcon,
  Radar as PolarAreaIcon,
  GridOn as GridOnIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';

// Componentes de gráficos
import {
  Bar as BarChart,
  Doughnut as DoughnutChart,
  Pie,
  Line,
  PolarArea
} from 'react-chartjs-2';

// Date pickers
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';

// Registro de componentes de Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
} from 'chart.js';

// Registrar componentes necesarios de Chart.js
/**
 * Registra los componentes necesarios de Chart.js para su uso en la aplicación.
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

// Tipos de gráficos disponibles
const chartTypes = [
  { value: 'bar', label: 'Barras', icon: <BarChartIcon /> },
  { value: 'pie', label: 'Circular', icon: <PieChartIcon /> },
  { value: 'line', label: 'Líneas', icon: <LineChartIcon /> },
  { value: 'doughnut', label: 'Dona', icon: <DoughnutIcon /> },
  { value: 'polarArea', label: 'Área polar', icon: <PolarAreaIcon /> }
];

// Rangos de tiempo disponibles
const timeRanges = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Últimos 3 meses' },
  { value: 'year', label: 'Último año' },
  { value: 'all', label: 'Todo el tiempo' }
];

/**
 * Calcula el número de la semana para una fecha dada.
 * @param {Date} date - La fecha para la cual calcular el número de la semana.
 * @returns {number} El número de la semana.
 */
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consults, setConsults] = useState([]);
  const [responses, setResponses] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [responseChartType, setResponseChartType] = useState('pie');
  const [typeChartType, setTypeChartType] = useState('pie');
  const [clientChartType, setClientChartType] = useState('bar');
  const [classificationChartType, setClassificationChartType] = useState('pie');
  const [classificationChartData, setClassificationChartData] = useState({ labels: [], datasets: [] });
  const [classificationTimeData, setClassificationTimeData] = useState({ labels: [], datasets: [] });
  const [advisorName, setAdvisorName] = useState("");
  const auth = getAuth();

  // Estado para el filtro global de tiempo
  const [timeFilter, setTimeFilter] = useState({
    timeRange: 'month',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });

  // Estados para los filtros específicos de cada gráfico (sin timeRange, startDate, endDate)
  const [filters, setFilters] = useState({
    trend: {
      consultType: 'all'
    },
    responseStatus: {
      statusFilter: 'all'
    },
    consultTypes: {
      typeFilter: 'all'
    },
    clients: {
      companySearch: ''
    }
  });

  // Estados para los datos de los gráficos
  const [trendChartData, setTrendChartData] = useState({ labels: [], datasets: [] });
  const [responseRateChartData, setResponseRateChartData] = useState({ labels: [], datasets: [] });
  const [clientsStaticData, setClientsStaticData] = useState({ labels: [], datasets: [] });
  const [typesStaticData, setTypesStaticData] = useState({ labels: [], datasets: [] });
  const [clientsTimeData, setClientsTimeData] = useState({ labels: [], datasets: [] });
  const [typesTimeData, setTypesTimeData] = useState({ labels: [], datasets: [] });

  const open = Boolean(anchorEl);

  /**
   * Efecto para cargar los datos iniciales de consultas y respuestas desde Firestore.
   * Se ejecuta una vez al montar el componente.
   */
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();

      try {
        const consultsQuery = query(collection(db, 'Consults'));
        const consultsSnapshot = await getDocs(consultsQuery);
        const consultsData = consultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));

        setConsults(consultsData);

        const responsesQuery = query(collection(db, 'Responses'));
        const responsesSnapshot = await getDocs(responsesQuery);
        const responsesData = responsesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setResponses(responsesData);

      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Efecto para obtener y mostrar el nombre del asesor logueado.
   * Se ejecuta una vez al montar el componente y cuando cambia `auth`.
   */
  useEffect(() => {
    const fetchAdvisorName = async () => {
      try {
        const user = auth.currentUser;
        if (user && user.email) {
          const advisorsRef = collection(db, "Advisors");
          const q = query(advisorsRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const advisorData = querySnapshot.docs[0].data();
            setAdvisorName(advisorData.name || "");
          }
        }
      } catch (error) {
        console.error("Error al obtener el nombre del asesor:", error);
      }
    };

    fetchAdvisorName();
  }, [auth]);

  const filterConsults = (consults, { timeRange, startDate, endDate, typeFilter, statusFilter, companySearch }) => {
    let filtered = [...consults];
    const now = new Date();

    // Filtro por rango de tiempo
    if (timeRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(consult => consult.timestamp >= oneWeekAgo);
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(consult => consult.timestamp >= oneMonthAgo);
    } else if (timeRange === 'quarter') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(consult => consult.timestamp >= threeMonthsAgo);
    } else if (timeRange === 'year') {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(consult => consult.timestamp >= oneYearAgo);
    } else if (timeRange === 'custom') {
      filtered = filtered.filter(consult =>
        consult.timestamp >= startDate && consult.timestamp <= endDate
      );
    }

    // Filtro por tipo de consulta
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(consult => {
        const type = classifyConsultType(consult);
        return type === typeFilter;
      });
    }

    // Filtro por estado de respuesta
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(consult => {
        const status = classifyResponseStatus(consult);
        return status === statusFilter;
      });
    }

    // Filtro por búsqueda de empresa
    if (companySearch && companySearch !== '') {
      filtered = filtered.filter(consult =>
        (consult.company || consult.email || 'Cliente no identificado').toLowerCase()
          .includes(companySearch.toLowerCase())
      );
    }

    return filtered;
  };

  /**
   * Efecto para actualizar los datos del gráfico de tendencia de consultas.
   * Se ejecuta cuando cambian las consultas, los filtros de tendencia o el filtro de tiempo global.
   */
  useEffect(() => {
    const trendFiltered = filterConsults(consults, { ...filters.trend, ...timeFilter });
    setTrendChartData(generateTimeData(trendFiltered, () => 'Consultas'));
  }, [consults, filters.trend, timeFilter]);

  /**
   * Efecto para actualizar los datos del gráfico de estado de respuestas.
   * Se ejecuta cuando cambian las consultas, los filtros de estado de respuesta o el filtro de tiempo global.
   */
  useEffect(() => {
    const responseFiltered = filterConsults(consults, { ...filters.responseStatus, ...timeFilter });
    setResponseRateChartData({
      labels: ['Respondidas a tiempo', 'Respondidas tarde', 'No respondidas'],
      datasets: [{
        label: 'Estado de respuestas',
        data: [
          responseFiltered.filter(consult => classifyResponseStatus(consult) === 'A tiempo').length,
          responseFiltered.filter(consult => classifyResponseStatus(consult) === 'Tardía').length,
          responseFiltered.filter(consult => classifyResponseStatus(consult) === 'No respondida').length
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      }]
    });
  }, [consults, filters.responseStatus, timeFilter]);

  /**
   * Efecto para actualizar los datos de los gráficos de tipos de consulta (estático y temporal).
   * Se ejecuta cuando cambian las consultas, los filtros de tipos de consulta o el filtro de tiempo global.
   */
  useEffect(() => {
    const typesFiltered = filterConsults(consults, { ...filters.consultTypes, ...timeFilter });

    const consultsByType = typesFiltered.reduce((acc, consult) => {
      const type = classifyConsultType(consult);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    setTypesStaticData({
      labels: Object.keys(consultsByType),
      datasets: [{
        label: 'Consultas por tipo',
        data: Object.values(consultsByType),
        backgroundColor: Object.keys(consultsByType).map((_, index) =>
          `hsl(${(index * 360 / Object.keys(consultsByType).length)}, 70%, 50%, 0.6)`
        ),
        borderColor: Object.keys(consultsByType).map((_, index) =>
          `hsl(${(index * 360 / Object.keys(consultsByType).length)}, 70%, 50%)`
        ),
        borderWidth: 1,
      }]
    });

    setTypesTimeData(generateTimeData(typesFiltered, consult => classifyConsultType(consult)));
  }, [consults, filters.consultTypes, timeFilter]);

  /**
   * Efecto para actualizar los datos de los gráficos de clientes (estático y temporal).
   * Se ejecuta cuando cambian las consultas, los filtros de clientes o el filtro de tiempo global.
   */
  useEffect(() => {
    const clientsFiltered = filterConsults(consults, { ...filters.clients, ...timeFilter });

    const topClients = clientsFiltered.reduce((acc, consult) => {
      const clientKey = consult.company || consult.email || 'Cliente no identificado';
      acc[clientKey] = (acc[clientKey] || 0) + 1;
      return acc;
    }, {});

    const filteredClients = Object.entries(topClients)
      .filter(([client]) =>
        filters.clients.companySearch === '' ||
        client.toLowerCase().includes(filters.clients.companySearch.toLowerCase())
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setClientsStaticData({
      labels: filteredClients.map(([client]) => client),
      datasets: [{
        label: 'Consultas por cliente',
        data: filteredClients.map(([_, count]) => count),
        backgroundColor: filteredClients.map((_, index) =>
          `hsl(${(index * 360 / filteredClients.length)}, 70%, 50%, 0.6)`
        ),
        borderColor: filteredClients.map((_, index) =>
          `hsl(${(index * 360 / filteredClients.length)}, 70%, 50%)`
        ),
        borderWidth: 1,
      }]
    });

    setClientsTimeData(generateTimeData(
      clientsFiltered.filter(consult =>
        filteredClients.some(([client]) =>
          client === (consult.company || consult.email || 'Cliente no identificado')
        )
      ),
      consult => consult.company || consult.email || 'Cliente no identificado'
    ));
  }, [consults, filters.clients, timeFilter]);

  /**
   * Maneja el cambio en el filtro de rango de tiempo.
   * @param {string} value - El nuevo valor del rango de tiempo.
   */
  const handleTimeRangeChange = (value) => {
    setTimeFilter(prev => ({
      ...prev,
      timeRange: value
    }));
  };

  /**
   * Efecto para actualizar las fechas de inicio y fin cuando cambia el `timeRange`.
   * Se ejecuta cuando `timeFilter.timeRange` cambia.
   */
  useEffect(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = now;

    switch (timeFilter.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = timeFilter.startDate;
        endDate = timeFilter.endDate;
    }

    setTimeFilter(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  }, [timeFilter.timeRange]);

  /**
   * Calcula la cantidad de ítems clasificados por cliente y el total de ítems clasificados.
   * @returns {{itemsByClient: Object<string, number>, totalItems: number}} Un objeto con los ítems por cliente y el total.
   */
  const calculateClassifiedItems = () => {
    const itemsByClient = {};
    let totalItems = 0;

    consults.forEach(consult => {
      if (consult.type === 'Clasificación arancelaria' && consult.itemsCount) {
        const clientKey = consult.company || consult.email || 'Cliente no identificado';
        itemsByClient[clientKey] = (itemsByClient[clientKey] || 0) + consult.itemsCount;
        totalItems += consult.itemsCount;
      }
    });

    return {
      itemsByClient,
      totalItems
    };
  };

  const handleConsultTypeFilterChange = (value) => {
    setFilters(prev => ({
      ...prev,
      consultTypes: {
        ...prev.consultTypes,
        typeFilter: value
      }
    }));
  };

  const handleResponseStatusFilterChange = (value) => {
    setFilters(prev => ({
      ...prev,
      responseStatus: {
        ...prev.responseStatus,
        statusFilter: value
      }
    }));
  };

  const handleCompanySearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      clients: {
        ...prev.clients,
        companySearch: value
      }
    }));
  };

  const handleDateRangeClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDateRangeClose = () => {
    setAnchorEl(null);
  };

  const applyCustomDateRange = () => {
    setTimeFilter(prev => ({
      ...prev,
      timeRange: 'custom'
    }));
    setAnchorEl(null);
  };

  /**
   * Efecto para actualizar los datos de los gráficos de clasificación arancelaria (estático y temporal).
   * Se ejecuta cuando cambian las consultas.
   */
  useEffect(() => {
    const classifiedConsults = consults.filter(consult => consult.type === 'Clasificación arancelaria');

    // Datos estáticos
    const itemsByClient = classifiedConsults.reduce((acc, consult) => {
      const clientKey = consult.company || consult.email || 'Cliente no identificado';
      acc[clientKey] = (acc[clientKey] || 0) + (consult.itemsCount || 0);
      return acc;
    }, {});

    setClassificationChartData({
      labels: Object.keys(itemsByClient),
      datasets: [{
        label: 'Ítems Clasificados',
        data: Object.values(itemsByClient),
        backgroundColor: Object.keys(itemsByClient).map((_, i) =>
          `hsl(${(i * 360 / Object.keys(itemsByClient).length)}, 70%, 50%, 0.6)`
        ),
        borderColor: Object.keys(itemsByClient).map((_, i) =>
          `hsl(${(i * 360 / Object.keys(itemsByClient).length)}, 70%, 50%)`
        ),
        borderWidth: 1
      }]
    });

    // Datos temporales
    setClassificationTimeData(generateTimeData(
      classifiedConsults,
      consult => consult.company || consult.email || 'Cliente no identificado'
    ));
  }, [consults]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  /**
   * Clasifica el tipo de consulta, diferenciando entre asesoría técnica interna y externa.
   * @param {object} consult - La consulta a clasificar.
   * @returns {string} El tipo de consulta clasificado.
   */
  const classifyConsultType = (consult) => {
    if (!consult.type) return 'Sin tipo';

    if (consult.type === 'Asesoría Técnica') {
      return consult.tipoAsesoria === 'interna'
        ? 'Asesoría Técnica (Interna)'
        : 'Asesoría Técnica (Externa)';
    }

    return consult.type;
  };

  /**
   * Clasifica el estado de respuesta de una consulta (A tiempo, Tardía, No respondida).
   * @param {object} consult - La consulta a clasificar.
   * @returns {string} El estado de respuesta clasificado.
   */
  const classifyResponseStatus = (consult) => {
    const response = responses.find(res => res.consultaId === consult.id);

    if (!response) return 'No respondida';

    const responseTime = response.timestamp.getTime() - consult.timestamp.getTime();
    return responseTime <= 24 * 60 * 60 * 1000 ? 'A tiempo' : 'Tardía';
  };

  /**
   * Genera el nombre del archivo para el reporte de Excel.
   * @returns {string} El nombre del archivo generado.
   */
  const generateFileName = () => {
    const now = new Date();
    const month = now.toLocaleDateString('es-ES', { month: 'long' });
    const year = now.getFullYear();
    return `INDICADORES GERENCIA TÉCNICA ${month.toUpperCase()} ${year}`;
  };

  const generateTimeData = (items, getKey) => {
    if (!items || items.length === 0) {
      return { labels: [], datasets: [] };
    }

    let rangeStart, rangeEnd;
    const now = new Date();

    const timeRange = filters.trend.timeRange; // Usamos el filtro de tendencia como base

    if (timeRange === 'week') {
      rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      rangeEnd = now;
    } else if (timeRange === 'month') {
      rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      rangeEnd = now;
    } else if (timeRange === 'quarter') {
      rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      rangeEnd = now;
    } else if (timeRange === 'year') {
      rangeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      rangeEnd = now;
    } else if (timeRange === 'custom') {
      rangeStart = new Date(filters.trend.startDate);
      rangeEnd = new Date(filters.trend.endDate);
    } else {
      const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
      rangeStart = sorted[0].timestamp;
      rangeEnd = sorted[sorted.length - 1].timestamp;
    }

    const diffTime = Math.abs(rangeEnd - rangeStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let interval = 1;
    if (diffDays > 90) interval = 7;
    if (diffDays > 365) interval = 30;

    const keys = [...new Set(items.map(item => getKey(item)))];
    const dataByKey = {};
    keys.forEach(key => {
      dataByKey[key] = Array(Math.ceil(diffDays / interval)).fill(0);
    });

    const labels = [];

    for (let i = 0; i <= diffDays; i += interval) {
      const currentDate = new Date(rangeStart);
      currentDate.setDate(currentDate.getDate() + i);

      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      if (interval > 1) {
        dayEnd.setDate(dayEnd.getDate() + interval - 1);
      }

      const periodItems = items.filter(
        item => item.timestamp >= dayStart && item.timestamp <= dayEnd
      );

      const periodCounts = periodItems.reduce((acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const periodIndex = Math.floor(i / interval);
      keys.forEach(key => {
        dataByKey[key][periodIndex] = periodCounts[key] || 0;
      });

      let label;
      if (interval === 1) {
        label = currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      } else if (interval === 7) {
        label = `Sem ${getWeekNumber(currentDate)}`;
      } else {
        label = currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }

      labels.push(label);
    }

    const datasets = keys.map((key, index) => ({
      label: key,
      data: dataByKey[key],
      backgroundColor: `hsl(${(index * 360 / keys.length)}, 70%, 50%, 0.2)`,
      borderColor: `hsl(${(index * 360 / keys.length)}, 70%, 50%)`,
      borderWidth: 2,
      tension: 0.1,
      fill: false
    }));

    return { labels, datasets };
  };

  /**
   * Exporta los datos de los reportes a un archivo de Excel.
   */
  const exportToExcel = () => {
    const fileName = generateFileName();
    const now = new Date();
    const monthName = now.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
    const year = now.getFullYear();

    // Obtener el primer y último día del mes actual
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filtrar consultas del mes actual
    const monthlyConsults = consults.filter(consult =>
      consult.timestamp >= firstDay && consult.timestamp <= lastDay
    );

    // Obtener datos
    const responseData = getMonthlyResponseData(monthlyConsults);
    const classifiedItems = calculateMonthlyClassifiedItems(monthlyConsults);
    const topClients = getTopClients(monthlyConsults, 5);
    const consultsByType = getConsultsByType(monthlyConsults);

    // Definir estilos
    const styles = {
      header: {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        fill: { fgColor: { rgb: '1B5C94' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'medium', color: { rgb: '1B5C94' } },
          bottom: { style: 'medium', color: { rgb: '1B5C94' } },
          left: { style: 'medium', color: { rgb: '1B5C94' } },
          right: { style: 'medium', color: { rgb: '1B5C94' } }
        }
      },
      subHeader: {
        font: { bold: true, color: { rgb: '1B5C94' }, sz: 12 },
        fill: { fgColor: { rgb: 'D9E8F5' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '1B5C94' } },
          bottom: { style: 'thin', color: { rgb: '1B5C94' } },
          left: { style: 'thin', color: { rgb: '1B5C94' } },
          right: { style: 'thin', color: { rgb: '1B5C94' } }
        }
      },
      indicatorHeader: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '5B9BD5' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '1B5C94' } },
          bottom: { style: 'thin', color: { rgb: '1B5C94' } },
          left: { style: 'thin', color: { rgb: '1B5C94' } },
          right: { style: 'thin', color: { rgb: '1B5C94' } }
        }
      },
      cell: {
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '1B5C94' } },
          bottom: { style: 'thin', color: { rgb: '1B5C94' } },
          left: { style: 'thin', color: { rgb: '1B5C94' } },
          right: { style: 'thin', color: { rgb: '1B5C94' } }
        }
      },
      percentage: {
        numFmt: '0.00%',
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '1B5C94' } },
          bottom: { style: 'thin', color: { rgb: '1B5C94' } },
          left: { style: 'thin', color: { rgb: '1B5C94' } },
          right: { style: 'thin', color: { rgb: '1B5C94' } }
        }
      }
    };

    // Crear datos para la hoja
    const data = [
      // Título principal
      [{ v: `INDICADORES GERENCIA TÉCNICA - ${monthName} ${year}`, t: 's', s: styles.header }],
      [''], // Espacio

      // Indicadores principales (en columnas)
      [
        { v: 'INDICADOR', t: 's', s: styles.subHeader },
        { v: 'VALOR', t: 's', s: styles.subHeader },
        { v: 'PORCENTAJE', t: 's', s: styles.subHeader }
      ],
      [
        'Consultas recibidas',
        responseData.total,
        ''
      ],
      [
        'Consultas respondidas',
        responseData.answered,
        { v: responseData.answered / responseData.total, t: 'n', s: styles.percentage }
      ],
      [
        'Respondidas a tiempo',
        responseData.timely,
        { v: responseData.timely / responseData.answered, t: 'n', s: styles.percentage }
      ],
      [
        'Ítems clasificados',
        classifiedItems.totalItems,
        ''
      ],
      [''], // Espacio

      // Top 5 clientes
      [
        { v: 'TOP 5 CLIENTES', t: 's', s: styles.subHeader },
        { v: 'CONSULTAS', t: 's', s: styles.subHeader },
        { v: 'PORCENTAJE', t: 's', s: styles.subHeader }
      ],
      ...topClients.map(client => [
        client.name,
        client.count,
        { v: client.count / responseData.total, t: 'n', s: styles.percentage }
      ]),
      [''], // Espacio

      // Consultas por tipo
      [
        { v: 'TIPO DE CONSULTA', t: 's', s: styles.subHeader },
        { v: 'CANTIDAD', t: 's', s: styles.subHeader },
        { v: 'PORCENTAJE', t: 's', s: styles.subHeader }
      ],
      ...Object.entries(consultsByType).map(([type, count]) => [
        type,
        count,
        { v: count / responseData.total, t: 'n', s: styles.percentage }
      ]),
      [''], // Espacio

      // Ítems clasificados por cliente
      [
        { v: 'CLASIFICACIÓN ARANCELARIA', t: 's', s: styles.subHeader },
        { v: 'ÍTEMS', t: 's', s: styles.subHeader },
        { v: 'PORCENTAJE', t: 's', s: styles.subHeader }
      ],
      ...Object.entries(classifiedItems.itemsByClient)
        .sort((a, b) => b[1] - a[1])
        .map(([client, count]) => [
          client,
          count,
          { v: count / classifiedItems.totalItems, t: 'n', s: styles.percentage }
        ])
    ];

    // Crear hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Aplicar estilos generales
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);

        if (!ws[cell_ref]) continue;

        // Aplicar estilo de celda básico si no tiene estilo específico
        if (!ws[cell_ref].s) {
          ws[cell_ref].s = styles.cell;
        }

        // Combinar celdas para el título principal
        if (R === 0) {
          ws[cell_ref].s = styles.header;
          ws['!merges'] = ws['!merges'] || [];
          ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
        }
      }
    }

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 35 }, // Columna A (nombres)
      { wch: 15 }, // Columna B (valores)
      { wch: 15 }  // Columna C (porcentajes)
    ];

    // Congelar primera fila
    ws['!freeze'] = { xSplit: 0, ySplit: 2 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Indicadores");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    setSnackbarMessage('Reporte exportado exitosamente');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  /**
   * Obtiene los principales clientes basados en el número de consultas.
   * @param {Array<object>} consults - Lista de consultas.
   * @param {number} limit - Número máximo de clientes a retornar.
   * @returns {Array<{name: string, count: number}>} Lista de los principales clientes.
   */
  const getTopClients = (consults, limit) => {
    const clients = consults.reduce((acc, consult) => {
      const clientKey = consult.company || consult.email || 'Cliente no identificado';
      acc[clientKey] = (acc[clientKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(clients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  };

  /**
   * Agrupa las consultas por tipo.
   * @param {Array<object>} consults - Lista de consultas.
   * @returns {Object<string, number>} Objeto con el conteo de consultas por tipo.
   */
  const getConsultsByType = (consults) => {
    return consults.reduce((acc, consult) => {
      const type = classifyConsultType(consult);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  };

  // Nueva función para calcular datos mensuales
  const getMonthlyResponseData = (monthlyConsults) => {
    const totalConsults = monthlyConsults.length;
    const answeredConsults = monthlyConsults.filter(consult =>
      responses.some(response => response.consultaId === consult.id)
    ).length;

    const timelyAnswered = monthlyConsults.filter(consult => {
      const response = responses.find(res => res.consultaId === consult.id);
      if (!response) return false;

      const responseTime = response.timestamp.getTime() - consult.timestamp.getTime();
      return responseTime <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      total: totalConsults,
      answered: answeredConsults,
      timely: timelyAnswered,
      unanswered: totalConsults - answeredConsults,
      late: answeredConsults - timelyAnswered
    };
  };


  // Nueva función para ítems clasificados mensuales
  const calculateMonthlyClassifiedItems = (monthlyConsults) => {
    const itemsByClient = {};
    let totalItems = 0;

    monthlyConsults.forEach(consult => {
      if (consult.type === 'Clasificación arancelaria' && consult.itemsCount) {
        const clientKey = consult.company || consult.email || 'Cliente no identificado';
        itemsByClient[clientKey] = (itemsByClient[clientKey] || 0) + consult.itemsCount;
        totalItems += consult.itemsCount;
      }
    });

    return {
      itemsByClient,
      totalItems
    };
  };

  /**
   * Obtiene los datos de respuesta basados en los filtros actuales.
   * @returns {{total: number, answered: number, timely: number, unanswered: number, late: number}} Objeto con estadísticas de respuesta.
   */
  const getResponseData = () => {
    const filtered = filterConsults(consults, { ...filters.responseStatus, ...timeFilter });
    const totalConsults = filtered.length;
    const answeredConsults = filtered.filter(consult =>
      responses.some(response => response.consultaId === consult.id)
    ).length;

    const timelyAnswered = filtered.filter(consult => {
      const response = responses.find(res => res.consultaId === consult.id);
      if (!response) return false;

      const responseTime = response.timestamp.getTime() - consult.timestamp.getTime();
      return responseTime <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      total: totalConsults,
      answered: answeredConsults,
      timely: timelyAnswered,
      unanswered: totalConsults - answeredConsults,
      late: answeredConsults - timelyAnswered
    };
  };

  /**
   * Obtiene una lista de todos los tipos de consulta disponibles.
   * @returns {Array<string>} Lista de tipos de consulta.
   */
  const getAvailableTypes = () => {
    const types = new Set();

    consults.forEach(consult => {
      types.add(classifyConsultType(consult));
    });

    return Array.from(types);
  };

  /**
   * Opciones comunes para los gráficos.
   * @type {object}
   */
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label || ''}: ${context.raw}`;
          },
        },
      },
    },
  };

  /**
   * Componente para seleccionar el tipo de gráfico.
   * @param {object} props - Propiedades del componente.
   * @param {string} props.value - El tipo de gráfico actualmente seleccionado.
   * @param {function} props.onChange - Función para manejar el cambio de tipo de gráfico.
   * @returns {JSX.Element} El selector de tipo de gráfico.
   */
  const ChartTypeSelector = ({ value, onChange }) => (
    <ButtonGroup variant="outlined" size="small" sx={{ ml: 2 }}>
      {chartTypes.map((type) => (
        <Tooltip key={type.value} title={type.label}>
          <Button
            onClick={() => onChange(type.value)}
            color={value === type.value ? 'primary' : 'inherit'}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {type.icon}
          </Button>
        </Tooltip>
      ))}
    </ButtonGroup>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  /**
   * Componente principal de la sección de reportes.
   * Muestra varios gráficos y estadísticas sobre las consultas.
   * @returns {JSX.Element} El componente de reportes.
   */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ padding: '20px' }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Box sx={{ textAlign: 'left' }}>
            {advisorName && (
              <Typography variant="h5" fontWeight="bold" color="#1B5C94" gutterBottom>
                Bienvenido, {advisorName}
              </Typography>
            )}
          </Box>

          {/* Segunda fila: Consultas centrado */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="bold" color="#1B5C94" marginLeft={-15} gutterBottom>
              Reportes y Estadísticas
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<GridOnIcon />}
            onClick={exportToExcel}
          >
            Exportar a Excel
          </Button>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleDateRangeClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <Typography variant="h6">Seleccionar rango de fechas</Typography>
            <DatePicker
              label="Fecha de inicio"
              value={timeFilter.startDate}
              onChange={(newValue) => setTimeFilter(prev => ({
                ...prev,
                startDate: newValue
              }))}
              maxDate={timeFilter.endDate}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="Fecha de fin"
              value={timeFilter.endDate}
              onChange={(newValue) => setTimeFilter(prev => ({
                ...prev,
                endDate: newValue
              }))}
              minDate={timeFilter.startDate}
              maxDate={new Date()}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
            <Button
              variant="contained"
              onClick={applyCustomDateRange}
              startIcon={<CalendarIcon />}
            >
              Aplicar rango
            </Button>
          </Box>
        </Popover>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Consultas recibidas
                </Typography>
                <Typography variant="h4" component="h2">
                  {getResponseData().total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Consultas respondidas
                </Typography>
                <Typography variant="h4" component="h2">
                  {getResponseData().answered} ({getResponseData().total > 0 ? Math.round((getResponseData().answered / getResponseData().total) * 100) : 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Respondidas a tiempo
                </Typography>
                <Typography variant="h4" component="h2">
                  {getResponseData().timely} ({getResponseData().answered > 0 ? Math.round((getResponseData().timely / getResponseData().answered) * 100) : 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tendencia de consultas
                  </Typography>
            <ButtonGroup variant="contained" orientation="horizontal">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  onClick={() => handleTimeRangeChange(range.value)}
                  color={timeFilter.timeRange === range.value ? 'primary' : 'inherit'}
                >
                  {range.label}
                </Button>
              ))}
              <Button
                onClick={handleDateRangeClick}
                startIcon={<DateRangeIcon />}
                color={timeFilter.timeRange === 'custom' ? 'primary' : 'inherit'}
              >
                Personalizado
              </Button>
            </ButtonGroup>
                </Box>
                <Box sx={{ height: '400px' }}>
                  {trendChartData.labels && trendChartData.labels.length > 0 ? (
                    <Line
                      data={trendChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: { title: { display: true, text: 'Fecha' } },
                          y: {
                            title: { display: true, text: 'Número de consultas' },
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1">No hay datos disponibles</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Estado de respuestas
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
                      <InputLabel id="response-filter-label">Filtrar por estado</InputLabel>
                      <Select
                        labelId="response-filter-label"
                        value={filters.responseStatus.statusFilter}
                        onChange={(e) => handleResponseStatusFilterChange(e.target.value)}
                        label="Filtrar por estado"
                      >
                        <MenuItem value="all">Todos los estados</MenuItem>
                        <MenuItem value="A tiempo">A tiempo</MenuItem>
                        <MenuItem value="Tardía">Tardía</MenuItem>
                        <MenuItem value="No respondida">No respondida</MenuItem>
                      </Select>
                    </FormControl>
                    <ChartTypeSelector value={responseChartType} onChange={setResponseChartType} />
                  </Box>
                </Box>
                <Box sx={{ height: '300px' }}>
                  {responseRateChartData.labels && responseRateChartData.labels.length > 0 ? (
                    (() => {
                      switch (responseChartType) {
                        case 'bar':
                          return <BarChart data={responseRateChartData} options={commonChartOptions} />;
                        case 'pie':
                          return <Pie data={responseRateChartData} options={commonChartOptions} />;
                        case 'line':
                          return <Line
                            data={generateTimeData(
                              filterConsults(consults, filters.responseStatus),
                              classifyResponseStatus
                            )}
                            options={commonChartOptions}
                          />;
                        case 'doughnut':
                          return <DoughnutChart data={responseRateChartData} options={commonChartOptions} />;
                        case 'polarArea':
                          return <PolarArea data={responseRateChartData} options={{
                            ...commonChartOptions,
                            scales: {
                              r: {
                                beginAtZero: true,
                              }
                            }
                          }} />;
                        default:
                          return <Pie data={responseRateChartData} options={commonChartOptions} />;
                      }
                    })()
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1">No hay datos disponibles</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tipos de consulta
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
                      <InputLabel id="type-filter-label">Filtrar por tipo</InputLabel>
                      <Select
                        labelId="type-filter-label"
                        value={filters.consultTypes.typeFilter}
                        onChange={(e) => handleConsultTypeFilterChange(e.target.value)}
                        label="Filtrar por tipo"
                      >
                        <MenuItem value="all">Todos los tipos</MenuItem>
                        {getAvailableTypes().map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <ChartTypeSelector value={typeChartType} onChange={setTypeChartType} />
                  </Box>
                </Box>
                <Box sx={{ height: '300px' }}>
                  {typesStaticData.labels && typesStaticData.labels.length > 0 ? (
                    (() => {
                      switch (typeChartType) {
                        case 'bar':
                          return <BarChart data={typesStaticData} options={commonChartOptions} />;
                        case 'pie':
                          return <Pie data={typesStaticData} options={commonChartOptions} />;
                        case 'line':
                          return <Line data={typesTimeData} options={commonChartOptions} />;
                        case 'doughnut':
                          return <DoughnutChart data={typesStaticData} options={commonChartOptions} />;
                        case 'polarArea':
                          return <PolarArea data={typesStaticData} options={{
                            ...commonChartOptions,
                            scales: {
                              r: {
                                beginAtZero: true,
                              }
                            }
                          }} />;
                        default:
                          return <Pie data={typesStaticData} options={commonChartOptions} />;
                      }
                    })()
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1">No hay datos disponibles</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Consultas por cliente
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Buscar cliente..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      value={filters.clients.companySearch}
                      onChange={(e) => handleCompanySearchChange(e.target.value)}
                      sx={{ mr: 2 }}
                    />
                    <ChartTypeSelector value={clientChartType} onChange={setClientChartType} />
                  </Box>
                </Box>
                <Box sx={{ height: '400px' }}>
                  {clientsStaticData.labels && clientsStaticData.labels.length > 0 ? (
                    (() => {
                      switch (clientChartType) {
                        case 'bar':
                          return <BarChart data={clientsStaticData} options={commonChartOptions} />;
                        case 'pie':
                          return <Pie data={clientsStaticData} options={commonChartOptions} />;
                        case 'line':
                          return <Line data={clientsTimeData} options={commonChartOptions} />;
                        case 'doughnut':
                          return <DoughnutChart data={clientsStaticData} options={commonChartOptions} />;
                        case 'polarArea':
                          return <PolarArea data={clientsStaticData} options={{
                            ...commonChartOptions,
                            scales: {
                              r: {
                                beginAtZero: true,
                              }
                            }
                          }} />;
                        default:
                          return <BarChart data={clientsStaticData} options={commonChartOptions} />;
                      }
                    })()
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1">No hay datos disponibles</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Sección de Clasificación Arancelaria */}
          {/* Sección de Clasificación Arancelaria */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Clasificación Arancelaria
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ChartTypeSelector
                      value={classificationChartType}
                      onChange={setClassificationChartType}
                    />
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {/* Estadísticas principales */}
                  <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary">
                          Total de ítems clasificados
                        </Typography>
                        <Typography variant="h3" sx={{ my: 2 }}>
                          {calculateClassifiedItems().totalItems}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {Object.keys(calculateClassifiedItems().itemsByClient).length} clientes
                        </Typography>
                      </CardContent>
                    </Card>

                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Ítems</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(calculateClassifiedItems().itemsByClient)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([client, count]) => (
                              <TableRow key={client}>
                                <TableCell>{client}</TableCell>
                                <TableCell align="right">{count}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Gráfico principal */}
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: '400px' }}>
                      {classificationChartData.labels && classificationChartData.labels.length > 0 ? (
                        (() => {
                          const data = {
                            labels: Object.keys(calculateClassifiedItems().itemsByClient),
                            datasets: [{
                              label: 'Ítems Clasificados',
                              data: Object.values(calculateClassifiedItems().itemsByClient),
                              backgroundColor: Object.keys(calculateClassifiedItems().itemsByClient).map((_, i) =>
                                `hsl(${(i * 360 / Object.keys(calculateClassifiedItems().itemsByClient).length)}, 70%, 50%, 0.6)`
                              ),
                              borderColor: Object.keys(calculateClassifiedItems().itemsByClient).map((_, i) =>
                                `hsl(${(i * 360 / Object.keys(calculateClassifiedItems().itemsByClient).length)}, 70%, 50%)`
                              ),
                              borderWidth: 1
                            }]
                          };

                          switch (classificationChartType) {
                            case 'bar':
                              return <BarChart data={data} options={commonChartOptions} />;
                            case 'pie':
                              return <Pie data={data} options={commonChartOptions} />;
                            case 'line':
                              return <Line data={classificationTimeData} options={commonChartOptions} />;
                            case 'doughnut':
                              return <DoughnutChart data={data} options={commonChartOptions} />;
                            case 'polarArea':
                              return <PolarArea data={data} options={{
                                ...commonChartOptions,
                                scales: {
                                  r: {
                                    beginAtZero: true,
                                  }
                                }
                              }} />;
                            default:
                              return <BarChart data={data} options={commonChartOptions} />;
                          }
                        })()
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <Typography variant="body1">No hay datos de clasificación</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;