import { io } from 'socket.io-client';

// If deployed, add your Render/Heroku backend URL to VITE_BACKEND_URL in Vercel.
// Otherwise it defaults to localhost for development.
const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false // We will connect manually when the user enters the app
});
