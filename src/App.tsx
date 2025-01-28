import React, { useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { Brain } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <Onboarding onSubmit={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="border-b border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">CryptoPulse AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {user.name}</span>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Dashboard user={user} />
      </main>
    </div>
  );
}

export default App;