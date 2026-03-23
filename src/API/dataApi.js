import domo from "ryuu.js";
import axios from "axios";

export async function fetchAIData(prompt, template, maxWords) {
  try {
    // Validate the required "prompt" parameter
    if (!prompt || typeof prompt !== "string") {
      throw new Error("The 'prompt' parameter is required and must be a string.");
    }

    // Construct the body dynamically, including properties only if they are valid
    const body = {
      input: prompt,
      ...(template && typeof template === "string" && {
        promptTemplate: {
          template,
        },
      }),
      ...(maxWords && !isNaN(maxWords) && {
        parameters: {
          max_words: maxWords.toString(),
        },
      }),
    };

    // Send the POST request
    const response = await domo.post(`/domo/ai/v1/text/generation`, body);
    console.log("AI Response:", response.output);
    
    return response?.output;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error for better upstream handling
  }
}


export async function fetchData(dataset) {
  try {
    const response = await domo.get(`/data/v1/${dataset}`).then((data) => {
      return data;
    });
    // console.log(response);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function fetchSqlData(dataset, query) {
  // console.log("Query",query);
  
  // Ensure the query is a string
  if (typeof query !== "string") {
    throw new Error("Query must be a string");
  }

  try {
    // Fetch data from the API
    const apiData = await domo
      .post(`/sql/v1/${dataset}`, query, { contentType: "text/plain" })
      .then((data) => {
        // console.log('Fetched Data:', data);
        return data;
      });

    // Validate the fetched data
    if (!apiData || !apiData.columns || !apiData.rows) {
      throw new Error("Invalid data received from the API");
    }

    // Extract and clean column names
    const cleanedColumns = apiData.columns.map((column) => {
      return column
        .replace(/`/g, "")
        .replace(/T1\./g, "")
        .replace(/avg\((.*?)\)/i, "$1")
        .trim();
    });

    // Map rows to cleaned column names
    const jsonResult = apiData.rows.map((row) => {
      const jsonObject = {};
      cleanedColumns.forEach((cleanedColumn, index) => {
        jsonObject[cleanedColumn] = row[index];
      });
      return jsonObject;
    });

    // console.log("Mapped SQL DATA",jsonResult);

    // Return the dynamically created JSON
    return jsonResult;
  } catch (error) {
    console.error("Error fetching or processing data:", error);
    throw error; // Rethrow the error for the caller to handle
  }
}

export async function sendEmail(to, subject, body, attachment) {
  const data = {
    to,
    subject,
    body,
    ...(attachment && { attachment: [attachment] }),
  };

  if (data) {
    try {
      const response = await domo.post(
        `/domo/workflow/v1/models/email/start`,
        data
      );
      if (response) {
        console.log("response", response);
      }
    } catch (err) {
      console.error("Error sending email:", err);
    }
  }
}

//Dataflow
export const DataflowsActions = async (action, dataflowId) => {
  const data = {
    action,
    dataflowId,
    result: true,
  };

  if (data) {
    try {
      const response = await domo.post(
        `/domo/workflow/v1/models/dataflow/start`,
        data
      );
      if (response) {
        console.log("response", response);
      }
    } catch (err) {
      console.error("Error sending email:", err);
    }
  }
};
export const generateAccessToken = async (clientId, clientSecret) => {
  const tokenUrl = "https://api.domo.com/oauth/token";
  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "user",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );
    console.log("Response:", response);

    console.log("Access Token:", response.data.access_token);

    return response.data.access_token;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

//List Of Users
export const fetchUsers = async (accessToken) => {
  const userUrl = `https://api.domo.com/v1/users?limit=500`;
  console.log("accessToken", accessToken);
  try {
    if (!accessToken) {
      console.log("Access token not found");
      return;
    }
    const response = await axios.get(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("List of users with access token", response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching User details:", err);
  }
};

//List Of Dataset
export const fetchDatasets = async (accessToken) => {
  const datasetUrl = `https://api.domo.com/v1/datasets`;

  try {
    if (!accessToken) {
      await generateAccessToken();
    }
    const response = await axios.get(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log("List of dataset", response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
  }
};

//Perticaular Dataset Details
export const fetchDatasetDetails = async (accessToken, datasetId) => {
  const datasetUrl = `https://api.domo.com/v1/datasets/${datasetId}`;

  try {
    if (!accessToken) {
      await generateAccessToken();
    }

    const response = await axios.get(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log("data", response.data)
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
  }
};
