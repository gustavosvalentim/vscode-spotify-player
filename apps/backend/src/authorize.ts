import {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyCallback,
} from "aws-lambda";

const authorizeEndpointConfiguration = {
  client_id: process.env.CLIENT_ID || "",
  redirect_uri: process.env.REDIRECT_URI || "",
  response_type: "code",
  scope: process.env.SCOPE || "",
};
const urlParameters = new URLSearchParams(authorizeEndpointConfiguration);
const redirectResponse = {
  statusCode: 302,
  headers: {
    Location: process.env.AUTHORIZE_URL + "?" + urlParameters.toString(),
  },
  body: "Redirect",
};

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  callback(null, redirectResponse);
};
