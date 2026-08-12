import { useNavigate } from 'react-router-dom';
import { useAIContext } from '../../context/ai/AIContext';

export function usePrepareAIChat() {
  const navigate = useNavigate();
  const { prepareContext } = useAIContext();
  return (conversationType, context = {}) => {
    prepareContext({ ...context, conversation: { type: conversationType } });
    navigate('/ai', { state: { conversationType } });
  };
}
