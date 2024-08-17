import Body from "./components/Body";
import { SocketProvider } from "./context/SocketProvider";

function App() {
  return (
    <div>
      <SocketProvider>
        <Body />
      </SocketProvider>
    </div>
  );
}

export default App;
