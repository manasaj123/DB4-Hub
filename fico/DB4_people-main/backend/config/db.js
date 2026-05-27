import mongoose from "mongoose";
import colors from "colors";

// Main connection URL
const URL = `mongodb+srv://myAtlasDBUser:Anson.0983@myatlasclusteredu.kcjkzwt.mongodb.net/hrms?retryWrites=true&w=majority&appName=myAtlasClusterEDU`;

// Store connections for each company
const connections = {};

// Connect to main database
const connectMainDB = async () => {
  try {
    const conn = await mongoose.connect(URL);
    console.log(
      `🚀 Main MongoDB Connected: ${conn.connection.host}`.cyan.underline,
    );
    return conn;
  } catch (error) {
    console.log(
      `Error connecting to MongoDB: ${error.message}`.red.underline.bold,
    );
    process.exit(1);
  }
};

// // Connect to company databases
// const getCompanyConnection = async (companyCode) => {
//     if (!companyCode) {
//         throw new Error('Company code is required');
//     }

//     // Normalize company code
//     companyCode = companyCode.toUpperCase();

//     // Return existing connection if available
//     if (connections[companyCode]) {
//         console.log(`Using existing connection for company ${companyCode}`);
//         return connections[companyCode];
//     }

//     // Create a new connection for this company
//     try {
//         // Create a new connection with a specific database name for this company
//         const dbName = `hrms_${companyCode.toLowerCase()}`;

//         // Fix: Properly construct the connection URL
//         const baseUrl = URL.split('?')[0];
//         const queryParams = URL.split('?')[1] || '';
//         const connectionString = `${baseUrl}/${dbName}?${queryParams}`;

//         console.log(`Creating new connection to ${dbName} for company ${companyCode}`);
//         console.log(`Connection string: ${connectionString}`);

//         const connection = await mongoose.createConnection(connectionString);

//         // Verify connection was successful
//         if (!connection) {
//             throw new Error(`Failed to create connection for ${companyCode}`);
//         }

//         console.log(`🚀 Company DB Connected: ${connection.name || dbName} for ${companyCode}`.green.underline);

//         // Store the connection
//         connections[companyCode] = connection;
//         return connection;
//     } catch (error) {
//         console.log(`Error connecting to company database: ${error.message}`.red.underline.bold);
//         throw error;
//     }
// };

// Get or create a connection for a specific company
const getCompanyConnection = async (companyCode) => {
  if (!companyCode) throw new Error("Company code is required");
  companyCode = companyCode.toUpperCase();

  if (connections[companyCode]) {
    console.log(`Using existing connection for company ${companyCode}`);
    return connections[companyCode];
  }

  try {
    const dbName = `hrms_${companyCode.toLowerCase()}`;

    // Split the base URL to separate the path and query parameters
    const [baseUrl, queryParams] = URL.split("?");

    // Replace the database name in the path (currently /hrms) with /dbName
    const newBase = baseUrl.replace(/\/hrms$/, `/${dbName}`);
    const connectionString = `${newBase}?${queryParams}`;

    console.log(
      `Creating new connection to ${dbName} for company ${companyCode}`,
    );
    console.log(`Connection string: ${connectionString}`);

    const connection = await mongoose.createConnection(connectionString);
    connections[companyCode] = connection;
    console.log(
      `🚀 Company DB Connected: ${connection.name || dbName} for ${companyCode}`
        .green.underline,
    );
    return connection;
  } catch (error) {
    console.log(
      `Error connecting to company database: ${error.message}`.red.underline
        .bold,
    );
    throw error;
  }
};

const closeAllConnections = async () => {
  await mongoose.disconnect();
  for (const companyCode in connections) {
    await connections[companyCode].close();
  }
  console.log("All database connections closed".yellow);
};

export { connectMainDB, getCompanyConnection, closeAllConnections };
export default connectMainDB;
