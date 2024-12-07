import React, { useEffect, useState } from "react";  // Import React and useState, useEffect hooks for state management and side effects
import { Line } from "react-chartjs-2";  // Import the Line chart component from the 'react-chartjs-2' library
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";  // Import necessary components from the Chart.js library for chart rendering
import axios from "axios";  // Import axios for making HTTP requests

// Register required Chart.js components
ChartJS.register(
  CategoryScale, // For category labels on the x-axis (timestamps)
  LinearScale, // For scaling the y-axis (temperature values)
  PointElement, // For displaying individual data points on the graph
  LineElement, // For connecting the data points with lines
  Title, // For the title of the chart
  Tooltip, // For showing tooltips on hover
  Legend // For showing the legend with dataset labels
);

/**
 * The main Graph component that fetches and displays the temperature data in a line graph.
 * 
 * This component:
 * - Fetches temperature data from a Lambda function via an API call
 * - Processes the data for Chart.js to visualize the temperature from IoT devices and SMHI data
 * - Displays a loading message or an error message based on the data fetch status
 */
const Graph = () => {
  // State hooks to manage the data, loading state, and error state
  const [data, setData] = useState([]);  // Stores the fetched temperature data
  const [loading, setLoading] = useState(true);  // Tracks whether the data is still being loaded
  const [error, setError] = useState(null);  // Tracks any error that occurs during data fetching

  const lambdaUrl = "LAMBDA <URL>";  // Replace with your actual Lambda function URL for fetching data

  /**
   * useEffect hook to fetch data when the component mounts.
   * This fetches data from the Lambda URL and processes it for rendering.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);  // Set loading to true before making the API call
      try {
        const response = await axios.get(lambdaUrl);  // Fetch data from the Lambda function
        console.log("Lambda Response:", response.data);  // Log the response for debugging purposes
        setData(response.data);  // Set the fetched data to the state
      } catch (err) {
        console.error("Error fetching data:", err);  // Log any errors that occur during the fetch
        setError("Error fetching data from Lambda.");  // Set the error message
      } finally {
        setLoading(false);  // Set loading to false once the data fetch is complete (either success or failure)
      }
    };

    fetchData();  // Call the fetchData function to load data
  }, [lambdaUrl]);  // Dependency array ensures this effect runs only once when the component mounts

  /**
   * Prepare the chart data structure required by Chart.js for rendering the line chart.
   * - The labels are generated from the timestamps in the data.
   * - Two datasets are created: one for IoT temperature and one for SMHI temperature.
   */
  const chartData = {
    labels: data.map((item) => new Date(item.timestamp * 1000).toLocaleString()),  // Convert timestamps to readable date format
    datasets: [
      {
        label: "IoT Temperature",  // Label for the IoT dataset
        data: data.map((item) => item.iotTemperature || 0),  // Map IoT temperature data to the chart
        borderColor: "rgba(75, 192, 192, 1)",  // Line color for IoT temperature
        fill: false,  // Do not fill the area under the IoT temperature line
      },
      {
        label: "SMHI Temperature",  // Label for the SMHI dataset
        data: data.map((item) => item.smhiTemperature || 0),  // Map SMHI temperature data to the chart
        borderColor: "rgba(255, 99, 132, 1)",  // Line color for SMHI temperature
        fill: false,  // Do not fill the area under the SMHI temperature line
      },
    ],
  };

  return (
    <div>
      <h2>Temperature Dashboard</h2>  {/* Heading for the temperature dashboard */}
      {loading ? (  // Conditional rendering: If loading, display loading message
        <p>Loading data...</p>
      ) : error ? (  // If there is an error, display the error message
        <p>{error}</p>
      ) : (  // Once data is successfully fetched, render the line chart
        <Line data={chartData} />  // Render the Line chart component with the prepared data
      )}
    </div>
  );
};

export default Graph;  // Export the Graph component for use in other parts of the app
