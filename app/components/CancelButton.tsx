export const CancelButton = ({ onClose, className }: { onClose: () => void; className?: string }) => (
  <button onClick={onClose} className={className}>
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 8L8 24M8 8L24 24" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
);
