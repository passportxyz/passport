export const CancelButton = ({
  onClose,
  width = 56,
  height = 56,
  className,
}: {
  onClose: () => void;
  className?: string;
  width?: number;
  height?: number;
}) => (
  <button onClick={onClose} className={className}>
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M41.5 14.4131L14.0978 41.8153" stroke="#C1F6FF" stroke-width="2" stroke-linecap="round" />
      <path d="M41.5 41.8154L14.0978 14.4132" stroke="#C1F6FF" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>
);
