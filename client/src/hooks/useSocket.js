import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext.jsx';

export default function useSocket() {
  return useContext(SocketContext);
}
