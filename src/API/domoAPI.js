import domo from "ryuu.js";
// import Download from "downloadjs";

const BASE_URL = "/domo/datastores/v1";

const GetCurrentUser = () => {
  return domo
    .get("/domo/environment/v1")
    .then((user) => ({
      ...user,
      displayName: user.userName,
      avatarKey: `/domo/avatars/v2/USER/${user.userId}`,
    }))
    .catch((error) => {
      console.error("Error getting current user:", error);
      throw error;
    });
};

const GetAllUser = () => {
  return domo
    .get(`/domo/users/v1?limit={500}`)
    .then((response) => response)
    .catch((error) => {
      console.error("Error getting All users:", error);
      throw error;
    });
};

const GetUser = (userId) => {
  return domo
    .get(`/domo/users/v1/${userId}?includeDetails=true`)
    .then((user) => ({ ...user, userName: user.displayName }))
    .catch((error) => {
      console.error("Error getting user:", error);
      throw error;
    });
};

const CreateDocument = (collectionName, document) => {
  console.log(document);
  console.log(collectionName);

  return domo
    .post(`${BASE_URL}/collections/${collectionName}/documents/`, {
      content: document,
    })
    .then((response) => response)
    .catch((error) => {
      console.error("Error creating document:", error);
      throw error;
    });
};

const ListDocuments = (collectionName) => {
  return domo
    .get(`${BASE_URL}/collections/${collectionName}/documents/`)
    .then((response) => response)
    .catch((error) => {
      console.error("Error listing documents:", error);
      throw error;
    });
};

const GetDocument = (collectionName, documentId) => {
  return domo
    .get(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`)
    .then((response) => response)
    .catch((error) => {
      console.error("Error getting document:", error);
      throw error;
    });
};

const UpdateDocument = (collectionName, documentId, document) => {
  return domo
    .put(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`, {
      content: document,
    })
    .then((response) => response)
    .catch((error) => {
      console.error("Error updating document:", error);
      throw error;
    });
};
const queryDocumentsWithAggregations = (
  collectionName,
  query = {},
  aggregations = {},
  options = {}
) => {
  // Base URL for the query
  let url = `${BASE_URL}/collections/${collectionName}/documents/query?`;

  // Helper function to format aggregation parameters
  const formatAggregationParams = (params) => {
    return Object.entries(params)
      .map(([property, alias]) => `${property} ${alias}`)
      .join(", ");
  };

  // Append aggregation parameters to URL
  if (aggregations.groupby) url += `groupby=${aggregations.groupby.join(",")}&`;
  if (aggregations.count) url += `count=${aggregations.count}&`;
  if (aggregations.avg)
    url += `avg=${formatAggregationParams(aggregations.avg)}&`;
  if (aggregations.min)
    url += `min=${formatAggregationParams(aggregations.min)}&`;
  if (aggregations.max)
    url += `max=${formatAggregationParams(aggregations.max)}&`;
  if (aggregations.sum)
    url += `sum=${formatAggregationParams(aggregations.sum)}&`;
  if (aggregations.unwind) url += `unwind=${aggregations.unwind.join(",")}&`;

  // Append options to the URL
  if (options.orderby) url += `orderby=${options.orderby}&`;
  if (options.limit !== undefined) url += `limit=${options.limit}&`;
  if (options.offset !== undefined) url += `offset=${options.offset}&`;

  // Remove trailing "&" or "?" from the URL
  url = url.replace(/[&?]$/, "");

  return domo
    .post(url, query)
    .then((response) => {
      console.log("Query successful:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error querying documents with aggregations:", error);
      throw error;
    });
};

const DeleteDocument = (collectionName, documentId) => {
  return domo
    .delete(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`)
    .then((response) => response.data)
    .catch((error) => {
      console.error("Error deleting document:", error);
      throw error;
    });
};

const QueryDocument = (collectionName, query = {}, options = {}) => {
  // Base URL for querying documents
  let url = `${BASE_URL}/collections/${collectionName}/documents/query?`;

  // Append optional parameters to the URL
  if (options.limit !== undefined) url += `limit=${options.limit}&`;
  if (options.offset !== undefined) url += `offset=${options.offset}&`;
  if (options.orderby) url += `orderby=${options.orderby}&`;

  // Remove trailing "&" or "?" from the URL
  url = url.replace(/[&?]$/, "");

  return domo
    .post(url, query)
    .then((response) => {
      // console.log("Query successful:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error querying documents:", error);
      throw error;
    });
};

// Query documents based on a specific date range
const queryDocumentsByDate = (collectionName, dateString, options = {}) => {
  const query = {
    "createdOn": {
      "$lte": { "$date": dateString }
    }
  };
  return QueryDocument(collectionName, query, options);
};

const BulkDeleteDocuments = (collectionName, ids) => {
  return domo
    .delete(
      `${BASE_URL}/collections/${collectionName}/documents/bulk?ids=${ids}`
    )
    .then((response) => response)
    .catch((error) => {
      console.error("Error bulk deleting documents:", error);
      throw error;
    });
};

const UploadFile = (file, name, description = "", isPublic = false) => {
  const formData = new FormData();
  formData.append("file", file);
  const url = `/domo/data-files/v1?name=
             ${name}&description=${description}&public=${isPublic}`;
  const options = { contentType: "multipart" };
  return domo
    .post(url, formData, options)
    .then((response) => response)
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const UploadRevision = (file, fileId) => {
  const formData = new FormData();
  formData.append("file", file);
  const url = `/domo/data-files/v1/${fileId}`;
  const options = { contentType: "multipart" };
  return domo
    .put(url, formData, options)
    .then((response) => response)
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

// const DownloadFile = (fileId, filename, revisionId) => {
//   const options = { responseType: "blob" };
//   const url = `/domo/data-files/v1/${fileId}${
//     revisionId ? `/revisions/${revisionId}` : ""
//   }`;
//   return domo
//     .get(url, options)
//     .then((data) => {
//       Download(data, filename);
//     })
//     .then((response) => response)
//     .catch((err) => {
//       console.log(err);
//       throw err;
//     });
// };

const GetFile = (fileId, revisionId) => {
  const options = { responseType: "blob" };
  const url = `/domo/data-files/v1/${fileId}${
    revisionId ? `/revisions/${revisionId}` : ""
  }`;
  return domo
    .get(url, options)
    .then((data) => data)
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const ListAllUsers = async (
  includeDetails = false,
  limit = 100,
  offset = 0
) => {
  try {
    const response = await domo.get(
      `/domo/users/v1?includeDetails=${includeDetails}&limit=${limit}&offset=${offset}`
    );
    return response;
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

const partialupdateDocument = (collectionName, query, operation) => {
  const requestBody = {
    query: query,
    operation: operation,
  };

  console.log("Request body:", requestBody);

  return domo
    .put(
      `${BASE_URL}/collections/${collectionName}/documents/update`,
      requestBody
    )
    .then((response) => {
      console.log("Document updated successfully:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error updating document:", error);
      throw error;
    });
};

const DomoApi = {
  GetCurrentUser,
  GetAllUser,
  GetUser,
  CreateDocument,
  ListDocuments,
  DeleteDocument,
  BulkDeleteDocuments,
  GetDocument,
  UpdateDocument,
  QueryDocument,
  queryDocumentsByDate,
  UploadFile,
  UploadRevision,
  // DownloadFile,
  GetFile,
  queryDocumentsWithAggregations,
  ListAllUsers,
  partialupdateDocument,
};

export default DomoApi;
