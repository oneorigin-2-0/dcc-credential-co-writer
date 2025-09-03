import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

export const generateBadge = async (config) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/badge/generate`, config);
    return response.data;
  } catch (error) {
    console.error('Error generating badge:', error);
    throw error;
  }
};