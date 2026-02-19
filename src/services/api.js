// Enhanced API service with better error handling and CORS support
const API_BASE_URL = 'https://clarifyall.com/php-api';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make fetch request with retry logic
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, options);
    
    // Don't throw on error - let the caller handle it
    return response;
  } catch (error) {
    // If we have retries left and it's a network error, retry
    if (retries > 0 && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    // If no retries left or different error, throw
    throw error;
  }
}

const api = {
  async get(url) {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      // Get response text first (can only read once)
      const text = await response.text();
      
      // Check if response has content
      if (!text || text.trim() === '') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Empty response`);
        }
        throw new Error('Empty response from server');
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response text:', text);
        // If response is not ok, include status in error
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Invalid JSON: ${text.substring(0, 100)}`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      // Check if response is ok after parsing
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return { data };
    } catch (error) {
      console.error('API GET Error:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  },
  
  async post(url, data, isFormData = false) {
    try {
      const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache'
      };

      if (isFormData) {
        // For FormData, don't set Content-Type - browser will set it with boundary
        options.body = data;
      } else {
        options.headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        options.body = JSON.stringify(data);
      }

      const response = await fetchWithRetry(`${API_BASE_URL}${url}`, options);
      
      // Get response text first (can only read once)
      const text = await response.text();
      console.log('API POST Response:', response.status, text.substring(0, 500));
      
      // Check if response has content
      if (!text || text.trim() === '') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Empty response`);
        }
        throw new Error('Empty response from server');
      }
      
      // Try to parse JSON
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response text:', text);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Invalid JSON: ${text.substring(0, 100)}`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      // Check if response is ok after parsing
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return { data: responseData };
    } catch (error) {
      console.error('API POST Error:', error);
      throw new Error(`Failed to post data: ${error.message}`);
    }
  },

  async postFormData(url, formData) {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
        method: 'POST',
        // Don't set Content-Type header - browser will set it with boundary
        mode: 'cors',
        cache: 'no-cache',
        body: formData
      });
      
      const text = await response.text();
      console.log('API POST FormData Response:', response.status, text.substring(0, 500));
      
      if (!text || text.trim() === '') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Empty response`);
        }
        throw new Error('Empty response from server');
      }
      
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response text:', text);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Invalid JSON: ${text.substring(0, 100)}`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return { data: responseData };
    } catch (error) {
      console.error('API POST FormData Error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },

  async put(url, data, isFormData = false) {
    try {
      const options = {
        method: 'PUT',
        mode: 'cors',
        cache: 'no-cache'
      };

      if (isFormData) {
        // For FormData, don't set Content-Type - browser will set it with boundary
        options.body = data;
      } else {
        options.headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        options.body = JSON.stringify(data);
      }

      const response = await fetchWithRetry(`${API_BASE_URL}${url}`, options);
      
      // Get response text first (can only read once)
      const text = await response.text();
      
      // Check if response has content
      if (!text || text.trim() === '') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Empty response`);
        }
        throw new Error('Empty response from server');
      }
      
      // Try to parse JSON
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response text:', text);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Invalid JSON: ${text.substring(0, 100)}`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      // Check if response is ok after parsing
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return { data: responseData };
    } catch (error) {
      console.error('API PUT Error:', error);
      throw new Error(`Failed to update data: ${error.message}`);
    }
  },

  async delete(url) {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      // Get response text first (can only read once)
      const text = await response.text();
      
      // Check if response has content
      if (!text || text.trim() === '') {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Empty response`);
        }
        // Return empty success response
        return { data: { success: true, message: 'Deleted successfully' } };
      }
      
      // Try to parse JSON
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response text:', text);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Invalid JSON: ${text.substring(0, 100)}`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      // Check if response is ok after parsing
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return { data: responseData };
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw new Error(`Failed to delete data: ${error.message}`);
    }
  },
  
  // Test CORS connectivity
  async testCors() {
    try {
      const response = await fetch(`${API_BASE_URL}/test-cors.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      const data = await response.json();
      console.log('CORS Test Result:', data);
      return data;
    } catch (error) {
      console.error('CORS Test Failed:', error);
      throw error;
    }
  }
};

export default api;
