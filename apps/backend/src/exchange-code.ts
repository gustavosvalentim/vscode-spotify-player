import {
  APIGatewayProxyCallback,
  APIGatewayProxyEventV2,
  Context,
} from "aws-lambda";

const basicAuthorizationHeaderValue = Buffer.from(
  process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
).toString("base64");

const getTokenEndpointConfiguration = (code: string) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + basicAuthorizationHeaderValue,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: process.env.REDIRECT_URI || "",
    code,
  }),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  if (!event.body) {
    callback(null, {
      statusCode: 403,
      body: "Forbidden",
    });
    return;
  }

  const body = JSON.parse(event.body);
  const code = body.code as string | undefined;

  if (!code) {
    callback(null, {
      statusCode: 403,
      body: "Forbidden",
    });
    return;
  }

  const tokenResponse = await fetch(
    process.env.TOKEN_URL || "",
    getTokenEndpointConfiguration(code)
  );
  const tokenResponseBody = await tokenResponse.json();
  const response = {
    statusCode: 200,
    body: JSON.stringify(tokenResponseBody),
  };

  callback(null, response);
};
