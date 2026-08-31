import Widget from "./components/Widget";

const devConfig = {
  apiKey: "relay_live_dev_test_key",
  apiBaseUrl: "http://localhost:5000",
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Widget config={devConfig} />
    </div>
  );
}