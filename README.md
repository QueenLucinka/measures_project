# measures_project
A complete IoT temperature and humidity monitoring system using ESP32, AWS services (IoT Core, Lambda, S3, DynamoDB), and a React app for data visualization.

Measures: IoT Temperature and Humidity Monitoring System
This project demonstrates an end-to-end IoT system that collects temperature and humidity data using an ESP32 device, stores the data in AWS services, and visualizes it in a React application. The system integrates real-time and batch data handling to offer flexibility in monitoring and analyzing temperature trends.

Features
ESP32 Data Collection:
Sends simulated temperature and humidity data to AWS IoT Core.
Data is stored in DynamoDB for real-time access.
Data is also archived in an S3 bucket for long-term storage and analysis.


Dual Database Approach:
DynamoDB acts as a real-time database for quick access to the latest data.
S3 bucket serves as a cold storage database, ideal for batch processing, long-term data retention, and app integration.

Lambda Functions:
Fetch IoT device data from the S3 bucket.
Retrieve weather data from the Swedish Meteorological and Hydrological Institute (SHMI).
Calculate and compare differences between IoT and SHMI temperature data.
Provide combined data to the React app for visualization.

React Application:
Displays an interactive graph of IoT and SHMI temperature data over time.
Uses Chart.js to visualize temperature trends with real-time updates.
Architecture Overview

This project follows a cloud-native architecture leveraging AWS services:

IoT Data Collection:
ESP32 sends temperature and humidity data to AWS IoT Core.
Data is routed to DynamoDB for real-time access and S3 bucket for batch processing.

Cold Database (S3 Bucket):
Data in the S3 bucket is processed via AWS Lambda functions.
This ensures the React app can fetch historical data seamlessly, even when the ESP32 is offline.

React App:
Fetches data from the S3 bucket via Lambda functions.
Displays a graph comparing IoT and SHMI temperature data.

Workflow

Data Collection:
ESP32 device generates temperature and humidity data and sends it to AWS IoT Core.
Data is stored in DynamoDB and S3 bucket for different use cases:
DynamoDB: Real-time monitoring and live updates.
S3 bucket: Long-term data storage for app visualization.

AWS Lambda Functions:
Function 1: Fetch IoT data from S3 bucket.
Function 2: Fetch SHMI weather data.
Function 3: Combine IoT and SHMI data to calculate differences.
Function 4: Provide processed data to the React app.

React App:
Calls the Lambda function to fetch processed IoT and SHMI data.
Renders a graph using Chart.js to visualize temperature trends.

How to Use

Clone the Repository:
git clone https://github.com/your-username/measures_project.git
cd measures

Update Secrets:
Replace secrets.h with your own credentials for ESP32 (except WiFi credentials, which are omitted for security).
Add your AWS IoT Core endpoint and credentials.

Deploy AWS Infrastructure:
Set up an S3 bucket named monitor-temp-bucket.
Create a DynamoDB table to store real-time IoT data.
Deploy the provided Lambda functions with appropriate roles and permissions:
AmazonS3ReadOnlyAccess
AWSIoTFullAccess
AmazonDynamoDBFullAccess

Run the React App
Install dependencies:
npm install

Start the app:
npm start

Open your browser at http://localhost:3000 to view the temperature dashboard. 

Decisions and Trade-offs

DynamoDB for Real-time Updates:
Chosen for its low-latency performance and suitability for frequently changing IoT data.
Ideal for real-time monitoring and alerts.

S3 as a Cold Database:
S3 was chosen for its scalability and cost-effectiveness for long-term storage.
Enables efficient batch processing and historical trend analysis.

Using Lambda Functions:
Simplifies integration with S3 and DynamoDB.
Reduces the need for additional backend infrastructure.

Graph Visualization:
The React app uses Chart.js for an interactive and user-friendly data visualization experience.

Future Improvements

Add authentication for secure access to the React app.
Implement notifications for temperature anomalies using AWS SNS.
Expand data sources to include additional environmental metrics (e.g., pressure, wind speed).
Optimize data fetching for larger datasets using pagination.

Acknowledgments

Swedish Meteorological and Hydrological Institute (SHMI) for weather data.
AWS for providing IoT, S3, DynamoDB, and Lambda services.



