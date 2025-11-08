import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { hc } from "hono/client";
import { api, AppType } from "./hono.$";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: App,
  loader: () => {
    console.log("loader");
    return api()
      .$get({ query: { name: "Loader" } })
      .then((res) => res.text());
  },
});
const client = hc<AppType>("http://localhost:3000/").hono;

function App() {
  const data = Route.useLoaderData();
  const { data: response } = useQuery({
    queryKey: ["get"],
    queryFn: () => {
      console.log("queryFn");
      return api()
        .$get({ query: { name: "QueryFn" } })
        .then((res) => res.text());
    },
  });
  const { data: response2 } = useQuery({
    queryKey: ["get2"],
    queryFn: () => {
      console.log("queryFn2");
      return client.$get({ query: { name: "QueryFn2" } }).then((res) => res.text());
    },
  });
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(response, null, 2)}</pre>
      <pre>{JSON.stringify(response2, null, 2)}</pre>
    </div>
  );
}
