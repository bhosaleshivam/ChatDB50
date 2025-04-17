
import { ChatInterface } from "../components/chat/ChatInterface";

const Index = () => {
  return (
    <div className="bg-gray-50 flex flex-col" style={{width: "120vh"}}>
      <header className="py-4 px-6 bg-white border-b">
        <h1 className="text-2xl font-bold text-center">ChatDB50</h1>
      </header>
      
      <main className="flex-1 container max-w-6xl py-6 px-4">
        <div className="h-[70vh]">
          <ChatInterface />
        </div>
      </main>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        A DSCI 551 Group Project by
        Shivam Bhosale,
        Anish Nehete,
        Shivani Patel
      </footer>
    </div>
  );
};

export default Index;
