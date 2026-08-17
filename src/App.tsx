import React from 'react';
import { ReaderProvider, useReader } from './context/ReaderContext';
import { Navbar } from './components/Navbar';
import { BookshelfView } from './components/Bookshelf/BookshelfView';
import { RemoteBooksView } from './components/Remote/RemoteBooksView';
import { HistoryView } from './components/History/HistoryView';
import { StatsView } from './components/History/StatsView';
import { ReaderView } from './components/Reader/ReaderView';
import { SearchModal } from './components/SearchModal';
import './styles/index.css';
import './styles/components.css';
import './styles/reader.css';

const MainLayout: React.FC = () => {
  const { activeView } = useReader();

  if (activeView === 'reader') {
    return <ReaderView />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {activeView === 'bookshelf' && <BookshelfView />}
        {activeView === 'remote' && <RemoteBooksView />}
        {activeView === 'history' && <HistoryView />}
        {activeView === 'stats' && <StatsView />}
      </main>
      <SearchModal />
    </div>
  );
};

export function App() {
  return (
    <ReaderProvider>
      <MainLayout />
    </ReaderProvider>
  );
}

export default App;
