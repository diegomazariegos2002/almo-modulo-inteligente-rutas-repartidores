import axios from 'axios';
import { baseUrl } from './entorno';

axios.defaults.baseURL = baseUrl;
// Las pruebas inspeccionan el código de respuesta: un 4xx/5xx no debe lanzar una excepción.
axios.defaults.validateStatus = () => true;
