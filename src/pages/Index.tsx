import { useState } from 'react';
import Layout from '@/components/Layout';
import NotesView from '@/components/Notes/NotesView';
import TodosView from '@/components/Todos/TodosView';
import TimerView from '@/components/Timer/TimerView';

const Index = () => {
  const [activeTab, setActiveTab] = useState('notes');

  const renderContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesView />;
      case 'todos':
        return <TodosView />;
      case 'timer':
        return <TimerView />;
      default:
        return <NotesView />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
