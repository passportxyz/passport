import React from "react";
import "./Loader.css";
import spinner from "../assets/spinner.svg"; // Import SVG

const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <img src={spinner} alt="Loading..." className="loader-svg" />
    </div>
  );
};

export default Loader;
