import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sayHello } from "../functions/say-hello/reseouce"
import { runTraining } from "../functions/run-training/reseouce"
import { getInstanceLogs } from "../functions/get-instance-logs/reseouce"
import { queryInstances } from "../functions/query-instances/reseouce";
import { dockerProcessing } from "../functions/docker-processing/reseouce";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  sayHello: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.publicApiKey()]) // .guest()])
    .handler(a.handler.function(sayHello)),
  runTraining: a
    .query()
    .arguments({
      modelConfig: a.json(),
    })
    .returns(a.json())
    .authorization(allow => [allow.authenticated()]) // .publicApiKey() .guest()])
    .handler(a.handler.function(runTraining)),
  getInstanceLogs: a
    .query()
    .arguments({
      instanceId: a.string(),
      lastMinutes: a.string()
    })
    .returns(a.json())
    .authorization(allow => [allow.authenticated()]) // .guest()])
    .handler(a.handler.function(getInstanceLogs)),
  queryInstances: a
    .query()
    .arguments({
      queryInstanceStates: a.string().array(),
      timeRangeHours: a.integer()
    })
    .returns(a.json())
    .authorization(allow => [allow.authenticated()]) // .guest()])
    .handler(a.handler.function(queryInstances)),
  dockerProcessing: a
    .query()
    .arguments({
      s3key: a.string(),
    })
    .returns(a.json())
    .authorization(allow => [allow.authenticated()]) // .guest()])
    .handler(a.handler.function(dockerProcessing)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
