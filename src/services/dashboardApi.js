import axios from 'axios';

// Use relative URL to leverage Vite proxy during development
// The Vite proxy in vite.config.js forwards /api requests to http://127.0.0.1:8000
// For production, use environment variable or absolute URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000');

/**
 * Dashboard API Service
 * Handles all API calls for dashboard graphs and drilldown
 */

// Helper function to build query params
const buildQueryParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.discom_name) params.append('discom_name', filters.discom_name);
    if (filters.region_name) params.append('region_name', filters.region_name);
    if (filters.feeder_meter_no) params.append('feeder_meter_no', filters.feeder_meter_no);
    if (filters.dtu_meter_no) params.append('dtu_meter_no', filters.dtu_meter_no);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    return params;
};

// Helper function to normalize graph API responses
// Backend returns: {success: true, data: {data: [], metadata: {}}, metadata: {}}
// This function extracts the actual data array
const normalizeGraphResponse = (responseData) => {
    if (!responseData) return { data: [] };

    // If responseData.data is already an array, return as is
    if (Array.isArray(responseData.data)) {
        return responseData;
    }

    // If responseData.data is an object with a data property, extract it
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
        return {
            ...responseData,
            data: responseData.data.data
        };
    }

    // If responseData.data is an object but no nested data, return empty array
    if (responseData.data && typeof responseData.data === 'object') {
        return {
            ...responseData,
            data: []
        };
    }

    return responseData;
};

// 1. Hourly Consumption
export const getHourlyConsumption = async (filters) => {
    const params = buildQueryParams(filters);
    if (filters.drilldown_level) params.append('drilldown_level', filters.drilldown_level);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/hourly-consumption?${params}`);
    return normalizeGraphResponse(response.data);
};

// 2. Daily Trend of Zero Consumption Users
export const getZeroConsumptionTrend = async (filters) => {
    const params = buildQueryParams(filters);
    if (filters.drilldown_level) params.append('drilldown_level', filters.drilldown_level);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/zero-consumption-trend?${params}`);
    return normalizeGraphResponse(response.data);
};

// 3. Top Occurring Events
export const getTopEvents = async (filters) => {
    const params = buildQueryParams(filters);
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.limit) params.append('limit', filters.limit);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/top-events?${params}`);
    return normalizeGraphResponse(response.data);
};

// 4. Daily Events Volume
export const getDailyEventsVolume = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/daily-events-volume?${params}`);
    return normalizeGraphResponse(response.data);
};

// 5. Events Volume vs Weekday
export const getEventsByWeekday = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/events-by-weekday?${params}`);
    return normalizeGraphResponse(response.data);
};

// 6. Anomalies in Consumption
export const getConsumptionAnomalies = async (filters) => {
    const params = buildQueryParams(filters);
    if (filters.anomaly_threshold) params.append('anomaly_threshold', filters.anomaly_threshold);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/consumption-anomalies?${params}`);
    return normalizeGraphResponse(response.data);
};

// 7. Solar Power Generation Forecast
export const getSolarForecast = async (filters) => {
    const params = buildQueryParams(filters);
    if (filters.forecast_days) params.append('forecast_days', filters.forecast_days);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/solar-forecast?${params}`);
    return normalizeGraphResponse(response.data);
};

// 8. Anomaly Categories
export const getAnomalyCategories = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/graphs/anomaly-categories?${params}`);
    return normalizeGraphResponse(response.data);
};

// 10. AI Insights
export const getAIInsights = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/insights?${params}`);
    return response.data;
};

// Drilldown
export const getDrilldownData = async (drilldownRequest) => {
    const response = await axios.post(`${API_URL}/api/dashboard/drilldown`, drilldownRequest);
    return response.data;
};

// Detail View (Popup)
export const getDetailView = async (detailRequest) => {
    const response = await axios.post(`${API_URL}/api/dashboard/detail-view`, detailRequest);
    return response.data;
};

// KPI Endpoints
export const getTotalEnergyConsumed = async (filters) => {
    const params = buildQueryParams(filters);
    const url = `${API_URL}/api/dashboard/kpis/total-energy-consumed?${params}`;
    console.log('Fetching Total Energy Consumed:', url);
    try {
        const response = await axios.get(url, {
            timeout: 60000 // 60 second timeout
        });
        console.log('Total Energy Consumed response:', response.data);
        return response.data.data || response.data; // Handle both response structures
    } catch (error) {
        console.error('Error fetching Total Energy Consumed:', error);
        console.error('Request URL:', url);
        console.error('Error details:', error.response?.data || error.message);
        throw error;
    }
};

export const getTotalPowerLoss = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/total-power-loss?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getTotalDTUs = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/total-dtus?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getZeroEnergyUsers = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/zero-energy-users?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getSolarConsumers = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/solar-consumers?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getTotalSolarExport = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/total-solar-export?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getKPIBreakdown = async (kpiType, breakdownLevel, filters) => {
    const params = buildQueryParams(filters);
    params.append('kpi_type', kpiType);
    params.append('breakdown_level', breakdownLevel);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/breakdown?${params.toString()}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data; // Handle both response structures
};

export const getAverageCurrent = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/average-current?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

export const getAverageVoltage = async (filters) => {
    const params = buildQueryParams(filters);
    const response = await axios.get(`${API_URL}/api/dashboard/kpis/average-voltage?${params}`, {
        timeout: 60000 // 60 second timeout
    });
    return response.data.data || response.data;
};

