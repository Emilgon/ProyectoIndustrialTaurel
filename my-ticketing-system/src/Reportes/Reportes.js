import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { collection, query, getDocs, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, CircularProgress,
  ButtonGroup, Button, Box, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Popover,
  IconButton, Tooltip, Snackbar, Alert
} from '@mui/material';
import {
  Bar, Pie, Line, Doughnut, PolarArea
} from 'react-chartjs-2';
import {
  Search as SearchIcon, Logout as LogoutIcon,
  DateRange as DateRangeIcon, CalendarToday as CalendarIcon,
  BarChart as BarChartIcon, PieChart as PieChartIcon,
  ShowChart as LineChartIcon, DonutLarge as DoughnutIcon,
  Radar as PolarAreaIcon, Publish as PublishIcon,
  GridOn as GridOnIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
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

const chartTypes = [
  { value: 'bar', label: 'Barras', icon: <BarChartIcon /> },
  { value: 'pie', label: 'Circular', icon: <PieChartIcon /> },
  { value: 'line', label: 'Líneas', icon: <LineChartIcon /> },
  { value: 'doughnut', label: 'Dona', icon: <DoughnutIcon /> },
  { value: 'polarArea', label: 'Área polar', icon: <PolarAreaIcon /> }
];

const timeRanges = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Últimos 3 meses' },
  { value: 'year', label: 'Último año' },
  { value: 'all', label: 'Todo el tiempo' }
];

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
  const [isUploading, setIsUploading] = useState(false);
  const [responseChartType, setResponseChartType] = useState('pie');
  const [typeChartType, setTypeChartType] = useState('pie');
  const [clientChartType, setClientChartType] = useState('bar');

  // Estados para los filtros independientes de cada gráfico
  const [filters, setFilters] = useState({
    trend: {
      timeRange: 'month',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      consultType: 'all'
    },
    responseStatus: {
      timeRange: 'month',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      statusFilter: 'all'
    },
    consultTypes: {
      timeRange: 'month',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      typeFilter: 'all'
    },
    clients: {
      timeRange: 'month',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
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

  // Efectos para actualizar cada gráfico independientemente
  useEffect(() => {
    const trendFiltered = filterConsults(consults, filters.trend);
    setTrendChartData(generateTimeData(trendFiltered, () => 'Consultas'));
  }, [consults, filters.trend]);

  useEffect(() => {
    const responseFiltered = filterConsults(consults, filters.responseStatus);
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
  }, [consults, filters.responseStatus]);

  useEffect(() => {
    const typesFiltered = filterConsults(consults, filters.consultTypes);

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
  }, [consults, filters.consultTypes]);

  useEffect(() => {
    const clientsFiltered = filterConsults(consults, filters.clients);

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
  }, [consults, filters.clients]);

  // Manejadores de filtros independientes
  const handleTimeRangeChange = (value, chart) => {
    setFilters(prev => ({
      ...prev,
      [chart]: {
        ...prev[chart],
        timeRange: value
      }
    }));
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

  const applyCustomDateRange = (chart) => {
    setFilters(prev => ({
      ...prev,
      [chart]: {
        ...prev[chart],
        timeRange: 'custom'
      }
    }));
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const classifyConsultType = (consult) => {
    if (!consult.type) return 'Sin tipo';

    if (consult.type === 'Asesoría Técnica') {
      return consult.tipoAsesoria === 'interna'
        ? 'Asesoría Técnica (Interna)'
        : 'Asesoría Técnica (Externa)';
    }

    return consult.type;
  };

  const classifyResponseStatus = (consult) => {
    const response = responses.find(res => res.consultaId === consult.id);

    if (!response) return 'No respondida';

    const responseTime = response.timestamp.getTime() - consult.timestamp.getTime();
    return responseTime <= 24 * 60 * 60 * 1000 ? 'A tiempo' : 'Tardía';
  };

  const generateFileName = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const quincena = day <= 15 ? '115' : '215';
    return `Reporte${month}${month}Actual${quincena}`;
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

  const exportToExcel = () => {
    const fileName = generateFileName();
    const data = [];

    // Datos generales
    const responseData = getResponseData();
    data.push(['Métrica', 'Valor']);
    data.push(['Consultas recibidas', responseData.total]);
    data.push(['Consultas respondidas', responseData.answered]);
    data.push(['Porcentaje de respuesta', `${Math.round((responseData.answered / responseData.total) * 100)}%`]);
    data.push(['Respondidas a tiempo', responseData.timely]);
    data.push(['Porcentaje a tiempo', `${Math.round((responseData.timely / responseData.answered) * 100)}%`]);
    data.push([]);

    // Consultas por cliente
    const topClients = filterConsults(consults, filters.clients).reduce((acc, consult) => {
      const clientKey = consult.company || consult.email || 'Cliente no identificado';
      acc[clientKey] = (acc[clientKey] || 0) + 1;
      return acc;
    }, {});

    const clientsData = Object.entries(topClients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    data.push(['Top Clientes', 'Consultas']);
    clientsData.forEach(([client, count]) => data.push([client, count]));
    data.push([]);

    // Consultas por tipo
    const consultsByType = filterConsults(consults, filters.consultTypes).reduce((acc, consult) => {
      const type = classifyConsultType(consult);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    data.push(['Tipo de Consulta', 'Cantidad']);
    Object.entries(consultsByType).forEach(([type, count]) => data.push([type, count]));

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const getResponseData = () => {
    const filtered = filterConsults(consults, filters.responseStatus);
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

  const getAvailableTypes = () => {
    const types = new Set();

    consults.forEach(consult => {
      types.add(classifyConsultType(consult));
    });

    return Array.from(types);
  };

  const simulateOrchestratorCall = async (payload) => {
    console.log("Simulando llamada a Orchestrator con:", payload);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      message: "Datos recibidos correctamente (simulación)",
      jdeResponse: {
        status: "success",
        table: "F55SA119",
        rowsAffected: 1,
        payload: payload
      }
    };
  };

  const uploadToIcaroTest = async () => {
    setIsUploading(true);

    try {
      const responseData = getResponseData();
      const topClients = filterConsults(consults, filters.clients).reduce((acc, consult) => {
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

      const payload = {
        totalConsultas: responseData.total,
        consultasRespondidas: responseData.answered,
        porcentajeRespuesta: responseData.total > 0 ? Math.round((responseData.answered / responseData.total) * 100) : 0,
        respondidasATiempo: responseData.timely,
        porcentajeATiempo: responseData.answered > 0 ? Math.round((responseData.timely / responseData.answered) * 100) : 0,
        topClientes: filteredClients.map(([client, count]) => ({ cliente: client, consultas: count })),
        fechaActualizacion: new Date().toISOString()
      };

      const response = await simulateOrchestratorCall(payload);

      if (!response.success) {
        throw new Error(response.message);
      }

      setSnackbarMessage(`Simulación exitosa: ${response.message}`);
      setSnackbarSeverity('success');

      console.log("Estructura para JDE:", {
        table: "F55SA119",
        company: "TU_COMPANY",
        document: "IND" + new Date().getTime(),
        values: payload
      });

    } catch (error) {
      console.error('Error en simulación:', error);
      setSnackbarMessage('Error en simulación: ' + error.message);
      setSnackbarSeverity('error');
    } finally {
      setIsUploading(false);
      setSnackbarOpen(true);
    }
  };

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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ padding: '20px' }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h4" component="h1" color="#1B5C94">
            Reportes y Estadísticas
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PublishIcon />}
              onClick={uploadToIcaroTest}
              disabled={isUploading}
              sx={{ ml: 2 }}
            >
              {isUploading ? 'Enviando...' : 'Subir a ICARO (Prueba)'}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<GridOnIcon />}
              onClick={exportToExcel}
              sx={{ ml: 2 }}
            >
              Exportar a Excel
            </Button>
          </Box>
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
              value={filters.trend.startDate}
              onChange={(newValue) => setFilters(prev => ({
                ...prev,
                trend: {
                  ...prev.trend,
                  startDate: newValue
                }
              }))}
              maxDate={filters.trend.endDate}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="Fecha de fin"
              value={filters.trend.endDate}
              onChange={(newValue) => setFilters(prev => ({
                ...prev,
                trend: {
                  ...prev.trend,
                  endDate: newValue
                }
              }))}
              minDate={filters.trend.startDate}
              maxDate={new Date()}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
            <Button
              variant="contained"
              onClick={() => applyCustomDateRange('trend')}
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
                        onClick={() => handleTimeRangeChange(range.value, 'trend')}
                        color={filters.trend.timeRange === range.value ? 'primary' : 'inherit'}
                      >
                        {range.label}
                      </Button>
                    ))}
                    <Button
                      onClick={handleDateRangeClick}
                      startIcon={<DateRangeIcon />}
                      color={filters.trend.timeRange === 'custom' ? 'primary' : 'inherit'}
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
                          return <Bar data={responseRateChartData} options={commonChartOptions} />;
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
                          return <Doughnut data={responseRateChartData} options={commonChartOptions} />;
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
                          return <Bar data={typesStaticData} options={commonChartOptions} />;
                        case 'pie':
                          return <Pie data={typesStaticData} options={commonChartOptions} />;
                        case 'line':
                          return <Line data={typesTimeData} options={commonChartOptions} />;
                        case 'doughnut':
                          return <Doughnut data={typesStaticData} options={commonChartOptions} />;
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
                          return <Bar data={clientsStaticData} options={commonChartOptions} />;
                        case 'pie':
                          return <Pie data={clientsStaticData} options={commonChartOptions} />;
                        case 'line':
                          return <Line data={clientsTimeData} options={commonChartOptions} />;
                        case 'doughnut':
                          return <Doughnut data={clientsStaticData} options={commonChartOptions} />;
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
                          return <Bar data={clientsStaticData} options={commonChartOptions} />;
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