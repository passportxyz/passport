export const Spinner = ({ color = "black" }: { color?: string }) => (
  <svg className="rotate" width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.5" cy="10" r="9" stroke={color} />
    <circle cx="9.5" cy="10" r="6" stroke={color} />
    <path
      d="M1.74414 10.0003C1.74414 5.71535 5.21779 2.2417 9.50276 2.2417"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);
