import { createFileRoute } from "@tanstack/react-router";
import { getTreaty } from "./api.$";
import { createServerFn } from "@tanstack/react-start";

const getData = createServerFn().handler(async () => {
  return (await getTreaty().get()).data;
});

export const Route = createFileRoute("/")({
  component: App,
  loader: () => getData(),
});

function App() {
  const data = Route.useLoaderData();
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
