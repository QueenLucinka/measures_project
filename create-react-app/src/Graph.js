import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graph = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lambdaUrl = "LAMBDA <URL>";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(lambdaUrl);
        setData(response.data);
      } catch (err) {
        setError("Error fetching data from Lambda.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lambdaUrl]);

  const chartData = {
    labels: data.map((item) => new Date(item.timestamp * 1000).toLocaleString()),
    datasets: [
      {
        label: "IoT Temperature",
        data: data.map((item) => item.iotTemperature || 0),
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
      },
      {
        label: "SMHI Temperature",
        data: data.map((item) => item.smhiTemperature || 0),
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h2>Temperature Dashboard</h2>
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <Line data={chartData} />
      )}
    </div>
  );
};

export default Graph;
