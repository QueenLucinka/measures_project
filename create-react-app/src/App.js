import React, { useState } from "react";
import Login from "./Login";
import Graph from "./Graph";

const App = () => {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <Graph />
        </div>
      )}
    </div>
  );
};

export default App;
