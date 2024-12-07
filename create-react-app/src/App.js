import React, { useState } from "react";  // Import React and useState hook for managing component state
import Login from "./Login";  // Import Login component to handle user authentication
import Graph from "./Graph";  // Import Graph component for displaying the temperature data

/**
 * The main App component that handles user login and displays the Graph component after a successful login.
 * - If the user is not logged in, the Login component is displayed.
 * - After a successful login, the Graph component is rendered along with a welcome message.
 */
const App = () => {
  // State to store the user information after login (e.g., username, token, etc.)
  const [user, setUser] = useState(null);

  /**
   * Callback function to handle successful login and update the user state.
   * This function is passed as a prop to the Login component.
   * 
   * @param {Object} userData - User data returned after a successful login (e.g., username, token).
   */
  const handleLoginSuccess = (userData) => {
    setUser(userData);  // Set the user data in state after login
  };

  return (
    <div className="App">
      {/* Conditional rendering based on the login status */}
      {!user ? (
        // If no user is logged in, display the Login component
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        // If the user is logged in, display the Graph component and a welcome message
        <div>
          <h2>Welcome, {user.username}!</h2> {/* Display the username after login */}
          <Graph />  {/* Show the Graph component to visualize the data */}
        </div>
      )}
    </div>
  );
};

export default App;
