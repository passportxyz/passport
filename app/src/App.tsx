// --- React Methods
import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Home, Layout, NoMatch, Passport } from "./views";

function App(): JSX.Element {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Passport />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
