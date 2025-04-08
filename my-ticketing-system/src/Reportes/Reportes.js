import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  ButtonGroup,
  Button,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Popover,
  IconButton,
  Tooltip
} from '@mui/material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Search as SearchIcon, 
  Logout as LogoutIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarIcon
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
  LineElement
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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
  const [timeRange, setTimeRange] = useState('month');
  const [filteredConsults, setFilteredConsults] = useState([]);
  const [consultTypeFilter, setConsultTypeFilter] = useState('all');
  const [companySearch, setCompanySearch] = useState('');
  const [availableTypes, setAvailableTypes] = useState([]);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      
      const consultsQuery = query(collection(db, 'Consults'));
      const consultsSnapshot = await getDocs(consultsQuery);
      const consultsData = consultsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setConsults(consultsData);
      
      const types = [...new Set(consultsData.map(consult => consult.type || 'Sin tipo'))];
      setAvailableTypes(types);
      
      const responsesQuery = query(collection(db, 'Responses'));
      const responsesSnapshot = await getDocs(responsesQuery);
      const responsesData = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setResponses(responsesData);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...consults];
    const now = new Date();

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

    if (consultTypeFilter !== 'all') {
      filtered = filtered.filter(consult => consult.type === consultTypeFilter);
    }

    setFilteredConsults(filtered);
  }, [timeRange, consults, consultTypeFilter, startDate, endDate]);

  const handleDateRangeClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDateRangeClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  const applyCustomDateRange = () => {
    setTimeRange('custom');
    setAnchorEl(null);
  };

  const getTimeData = () => {
    const data = [];
    const labels = [];
    
    let rangeStart, rangeEnd;
    const now = new Date();
    
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
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      if (filteredConsults.length === 0) {
        return { labels: [], data: [] };
      }
      
      const sorted = [...filteredConsults].sort((a, b) => a.timestamp - b.timestamp);
      rangeStart = sorted[0].timestamp;
      rangeEnd = sorted[sorted.length - 1].timestamp;
    }
    
    const diffTime = Math.abs(rangeEnd - rangeStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let interval = 1;
    if (diffDays > 90) interval = 7;
    if (diffDays > 365) interval = 30;
    
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
      
      const periodConsults = filteredConsults.filter(
        consult => consult.timestamp >= dayStart && consult.timestamp <= dayEnd
      ).length;
      
      data.push(periodConsults);
      
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
    
    return { labels, data };
  };

  const timeData = getTimeData();

  const trendChartData = {
    labels: timeData.labels,
    datasets: [
      {
        label: 'Consultas',
        data: timeData.data,
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const consultsByClient = filteredConsults.reduce((acc, consult) => {
    const clientKey = consult.company || consult.email;
    acc[clientKey] = (acc[clientKey] || 0) + 1;
    return acc;
  }, {});

  const filteredClients = Object.entries(consultsByClient)
    .filter(([client]) => 
      companySearch === '' || 
      client.toLowerCase().includes(companySearch.toLowerCase())
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const consultsByType = filteredConsults.reduce((acc, consult) => {
    const type = consult.type || 'Sin tipo';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const clientsChartData = {
    labels: filteredClients.map(([client]) => client),
    datasets: [
      {
        label: 'Consultas por cliente',
        data: filteredClients.map(([_, count]) => count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const typesChartData = {
    labels: Object.keys(consultsByType),
    datasets: [
      {
        data: Object.values(consultsByType),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const totalConsults = filteredConsults.length;
  const answeredConsults = filteredConsults.filter(consult => 
    responses.some(response => response.consultaId === consult.id)
  ).length;
  
  const timelyAnswered = filteredConsults.filter(consult => {
    const response = responses.find(res => res.consultaId === consult.id);
    if (!response) return false;
    
    const responseTime = response.timestamp.getTime() - consult.timestamp.getTime();
    return responseTime <= 24 * 60 * 60 * 1000;
  }).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ padding: '20px' }}>
        {/* Sección de título y controles */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h4" component="h1">
            Panel de Reportes y Estadísticas
          </Typography>
          
          {/* Contenedor de botones */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {/* Botones de rango de tiempo */}
            <ButtonGroup 
              variant="contained" 
              aria-label="Rango de tiempo"
              orientation="horizontal"
              sx={{
                '& .MuiButton-root': {
                  minWidth: '120px'
                }
              }}
            >
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  onClick={() => handleTimeRangeChange(range.value)}
                  color={timeRange === range.value ? 'primary' : 'inherit'}
                >
                  {range.label}
                </Button>
              ))}
              <Button
                onClick={handleDateRangeClick}
                startIcon={<DateRangeIcon />}
                color={timeRange === 'custom' ? 'primary' : 'inherit'}
              >
                Personalizado
              </Button>
            </ButtonGroup>

            {/* Botón de salir */}
            <Tooltip title="Salir al menú" arrow>
              <IconButton
                onClick={() => navigate('/asesor-control')}
                sx={{
                  color: "#1B5C94",
                  "&:hover": {
                    backgroundColor: "rgba(27, 92, 148, 0.1)"
                  }
                }}
              >
                <LogoutIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Popover para selección de fechas personalizadas */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleDateRangeClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <Typography variant="h6">Seleccionar rango de fechas</Typography>
            
            <DatePicker
              label="Fecha de inicio"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              maxDate={endDate}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
            
            <DatePicker
              label="Fecha de fin"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate}
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

        {/* Tarjetas de métricas */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Consultas recibidas
                </Typography>
                <Typography variant="h4" component="h2">
                  {totalConsults}
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
                  {answeredConsults} ({totalConsults > 0 ? Math.round((answeredConsults / totalConsults) * 100) : 0}%)
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
                  {timelyAnswered} ({answeredConsults > 0 ? Math.round((timelyAnswered / answeredConsults) * 100) : 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de tendencia */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendencia de consultas
                </Typography>
                <Box sx={{ height: '400px' }}>
                  <Line 
                    data={trendChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${context.dataset.label}: ${context.raw}`;
                            },
                            title: (context) => {
                              return context[0].label;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Fecha'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Número de consultas'
                          },
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de tipos de consulta */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Consultas por tipo
                  </Typography>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="type-filter-label">Filtrar por tipo</InputLabel>
                    <Select
                      labelId="type-filter-label"
                      value={consultTypeFilter}
                      onChange={(e) => setConsultTypeFilter(e.target.value)}
                      label="Filtrar por tipo"
                    >
                      <MenuItem value="all">Todos los tipos</MenuItem>
                      {availableTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ height: '300px' }}>
                  <Pie 
                    data={typesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Gráfico de top clientes */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Top clientes (por consultas)
                  </Typography>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Buscar empresa..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 200 }}
                  />
                </Box>
                <Box sx={{ height: '300px' }}>
                  <Bar 
                    data={clientsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;