import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChatCenter() {

  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);


  async function loadConversations(){

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );


      const data = await response.json();

console.log("Chat response status:", response.status);
console.log("Chat response data:", data);

if (!response.ok) {
  console.error("Chat conversations error:", data);
  setConversations([]);
  return;
}

setConversations(data);

console.log("Conversations saved to state:", data);


    } catch(error){

      console.error(error);

    }

  }


  return (

    <div className="mx-auto max-w-4xl p-6">

      <h1 className="mb-6 text-3xl font-bold">
        Chat Center
      </h1>


      <div className="space-y-4">


        {conversations.length === 0 ? (

          <div className="rounded-lg border p-6 text-center text-gray-500">
            No conversations yet.
          </div>

        ) : (

          conversations.map((chat)=>(

            <button
              key={chat.id}
              onClick={()=>navigate(`/chat/${chat.id}`)}
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left hover:bg-gray-50"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white">
                💬
              </div>


              <div>

              <h2 className="font-bold">
  {chat.buyer_name || chat.seller_name || "Conversation"}
</h2>


                <p className="text-sm text-gray-600">
                  {chat.last_message || "No messages yet"}
                </p>


              </div>


            </button>

          ))

        )}


      </div>


    </div>

  );

}
