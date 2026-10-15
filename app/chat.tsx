'use client';

import { useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Pulsante Invia premuto, testo:", input); // Log di controllo nel browser

    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      role: 'user',
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.label ? console.log("Invio fetch a /api/chat...") : null;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore dal server');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
        role: 'assistant',
        content: data.text,
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err: any) {
      console.error('[CLIENT ERROR]:', err);
      alert('Errore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">IA Senza Limiti</h1>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-8 border p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 shadow-inner">
        {messages.length > 0 ? (
          messages.map((m) => (
            <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 text-black ml-auto max-w-[80%]' : 'bg-gray-200 text-black mr-auto max-w-[80%]'}`}>
              <span className="font-bold block text-xs mb-1">
                {m.role === 'user' ? 'Tu' : 'IA'}
              </span>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center mt-20">Fai la tua prima domanda...</p>
        )}
        {loading && (
          <div className="p-3 rounded-lg bg-gray-200 text-gray-600 mr-auto max-w-[80%] italic animate-pulse">
            L'IA sta elaborando la risposta...
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Scrivi un messaggio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Invia
        </button>
      </form>
    </div>
  );
}