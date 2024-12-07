# **Measures: IoT Temperature and Humidity Monitoring System**

An end-to-end IoT solution for temperature and humidity monitoring using **ESP32**, **AWS services** (IoT Core, Lambda, S3, DynamoDB), and a **React app** for data visualization.

---

## **Features**

### **1. ESP32 Data Collection**
- Simulates temperature and humidity data and sends it to **AWS IoT Core**.
- Real-time data is stored in **DynamoDB**.
- Archived data is stored in an **S3 bucket** for long-term analysis.

### **2. Dual Database Design**
- **DynamoDB**: For low-latency, real-time data retrieval.
- **S3**: For scalable and cost-effective long-term storage.

### **3. AWS Lambda Functions**
Lambda functions are stored in the `AWS_lambda_functions/` directory and handle key operations:
- **`read-from-monitor-bucket.mjs`**: Fetches IoT data from **S3** and formats it for visualization.
- **`SHMIdata.mjs`**: Retrieves weather data from the **Swedish Meteorological and Hydrological Institute (SHMI)** API.
- **`CompareTempIoTShmi.mjs`**: Compares IoT and SHMI data for temperature analysis.
- **`GraphIOTandSHMI.mjs`**: Sends combined IoT and SHMI data to the React app for graphing.

### **4. React Application**
- Interactive graphs for IoT and SHMI temperature data visualization.
- Real-time updates using **Chart.js** for dynamic data trends.

---

## **Architecture Overview**

This system is designed using a **cloud-native architecture** powered by **AWS services**:

1. **Data Collection**:
   - **ESP32** sends simulated temperature and humidity data to **AWS IoT Core**.
   - Data is routed to:
     - **DynamoDB** for real-time access.
     - **S3 bucket** for long-term storage and batch analysis.

2. **Data Processing**:
   - **AWS Lambda functions** process IoT and SHMI data, compute differences, and prepare data for visualization.

3. **Visualization**:
   - The **React app** fetches processed data from **Lambda functions**.
   - Data is displayed using an interactive graph.

### **Proposed Architecture Diagram**
```plaintext
[ESP32 Device] --> [AWS IoT Core] --> [DynamoDB (Real-Time DB)]
                          \--> [S3 (Cold Storage)] --> [AWS Lambda] --> [React App]
```

---

## **Workflow**

1. **Data Collection**:
   - ESP32 device sends temperature and humidity data to AWS IoT Core.
   - Data is stored in both DynamoDB (real-time) and S3 (long-term).

2. **Data Processing via Lambda Functions**:
   - Fetch data from S3 and DynamoDB.
   - Retrieve SHMI weather data.
   - Compare IoT and SHMI temperature data.
   - Provide combined data for visualization.

3. **Data Visualization**:
   - React app fetches processed data via Lambda.
   - Graphs display temperature trends over time.

---

## **Hardware Requirements**
- **ESP32 development board**: Microcontroller for IoT applications.
- **Micro-USB cable**: For power and programming.
- **Optional: DHT22 sensor** for real-world environmental data collection.

---

## **Software Requirements**

1. **PlatformIO**: For ESP32 firmware development.  
   [Download PlatformIO](https://platformio.org/)

2. **Node.js**: For React app and dependency management.  
   [Download Node.js](https://nodejs.org/)

3. **AWS CLI** (optional): For managing AWS resources.  
   [Download AWS CLI](https://aws.amazon.com/cli/)

---

## **Setup Instructions**

### **Step 1: Set Up ESP32**
1. Install **PlatformIO** on your IDE (e.g., Visual Studio Code).
2. Include necessary libraries (e.g., `WiFi.h`, `PubSubClient.h`).
3. Configure your `secrets.h` file with:
   - Wi-Fi credentials.
   - AWS IoT Core endpoint and credentials.

### **Step 2: Set Up AWS Services**
1. **S3 Bucket**:
   - Create a bucket named `monitor-temp-bucket`.
2. **DynamoDB Table**:
   - Create a table for real-time IoT data.
3. **Lambda Functions**:
   - Deploy provided Lambda functions with appropriate IAM roles:
     - `AmazonS3ReadOnlyAccess`
     - `AWSIoTFullAccess`
     - `AmazonDynamoDBFullAccess`.

### **Step 3: Run the React App**
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/measures_project.git
   cd measures_project
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## **Decisions and Trade-offs**

- **DynamoDB**: Chosen for its low-latency performance, enabling real-time updates.
- **S3**: Offers cost-effective, scalable storage for long-term data.
- **Lambda Functions**: Simplify backend infrastructure and enable integration with AWS services.

---

## **Future Improvements**

1. **Notifications**:
   - Add alerts for temperature anomalies using **AWS SNS**.
2. **Data Expansion**:
   - Incorporate additional environmental metrics like pressure or wind speed.
3. **Data Optimization**:
   - Implement pagination for handling larger datasets.

---

## **Acknowledgments**
- **Swedish Meteorological and Hydrological Institute (SHMI)** for weather data.
- **AWS** for IoT, S3, DynamoDB, and Lambda services.

---

This version has improved readability and structure, along with a streamlined setup process and placeholder architecture diagram for better visualization.