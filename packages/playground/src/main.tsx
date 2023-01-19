import ReactDOM from 'react-dom/client';
import { App } from './App';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import './styles/index.css';

setBasePath(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.88/dist/'
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
