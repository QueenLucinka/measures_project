import React, { useState } from "react";  // Import React and useState hook for managing component state

/**
 * Login component that allows the user to enter their username and password.
 * 
 * This component:
 * - Accepts username and password inputs from the user
 * - Validates the credentials against hardcoded values (for example purposes)
 * - Calls the `onLoginSuccess` callback with the user data if credentials are valid
 * - Displays an error message if the credentials are invalid
 * 
 * @param {Object} props - Component props
 * @param {Function} onLoginSuccess - Callback function to handle successful login (pass username and token)
 * 
 * @returns {JSX.Element} - The rendered Login component
 */
const Login = ({ onLoginSuccess }) => {
  // State hooks for managing the form input and error state
  const [username, setUsername] = useState("");  // Holds the entered username
  const [password, setPassword] = useState("");  // Holds the entered password
  const [error, setError] = useState(null);     // Holds any error messages (e.g., invalid credentials)

  /**
   * Handles the login attempt.
   * If the username and password match the predefined values, it triggers the onLoginSuccess callback.
   * If the credentials are invalid, it displays an error message.
   */
  const handleLogin = () => {
    // Validate the credentials (this is a hardcoded example, in a real app you should validate via an API)
    if (username === "admin" && password === "123456789") {
      // If credentials are valid, trigger the onLoginSuccess callback with username and token
      onLoginSuccess({ username, token: "your_token_here" });
    } else {
      // If credentials are invalid, set the error message
      setError("Invalid credentials");
    }
  };

  return (
    <div>
      <h2>Login</h2> {/* Heading for the login form */}
      
      {/* Username input field */}
      <input 
        type="text" 
        placeholder="Username" 
        value={username}  // Bind input value to the username state
        onChange={(e) => setUsername(e.target.value)}  // Update the username state on user input
      />
      
      {/* Password input field */}
      <input 
        type="password" 
        placeholder="Password" 
        value={password}  // Bind input value to the password state
        onChange={(e) => setPassword(e.target.value)}  // Update the password state on user input
      />
      
      {/* Login button */}
      <button onClick={handleLogin}>Login</button>  {/* Trigger handleLogin on button click */}
      
      {/* Display error message if credentials are invalid */}
      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;  // Export the Login component for use in other parts of the app
