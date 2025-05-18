import axios from 'axios';

console.log('API baseURL:', process.env.REACT_APP_API_URL);
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

export default axios;