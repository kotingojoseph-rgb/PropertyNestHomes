import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChatCenter() {
  const [conversations, setConversations] = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingPeople, setLoadingPeople] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadConversations();
    loadPeople();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPeople(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  async function loadConversations() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Conversations error:", data);
        setConversations([]);
        return;
      }

      setConversations(data);
    } catch (error) {
      console.error("Load conversations error:", error);
    }
  }

  async function loadPeople(searchValue = "") {
    try {
      setLoadingPeople(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/people?search=${encodeURIComponent(
          searchValue
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("People error:", data);
        setPeople([]);
        return;
      }

      setPeople(data);
    } catch (error) {
      console.error("Load people error:", error);
      setPeople([]);
    } finally {
      setLoadingPeople(false);
    }
  }

  async function startConversation(person) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            property_id: null,
            seller_id: person.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Start conversation error:", data);
        return;
      }

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error("Start conversation error:", error);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Chat Center</h1>

      <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">People</h2>
          <p className="text-sm text-gray-500">
            Find a PropertyNestHomes user and start a conversation.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mb-4 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loadingPeople ? (
          <div className="py-6 text-center text-gray-500">
            Loading people...
          </div>
        ) : people.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            No people found.
          </div>
        ) : (
          <div className="space-y-3">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                    {(person.full_name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="font-semibold">
                      {person.full_name || "User"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {person.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startConversation(person)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Conversations</h2>

        {conversations.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-gray-500">
            No conversations yet.
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left shadow-sm hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white">
                  💬
                </div>

                <div>
                  <h3 className="font-bold">
                    {chat.buyer_name || chat.seller_name || "Conversation"}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {chat.last_message || "No messages yet"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
