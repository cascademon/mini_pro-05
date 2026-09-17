import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ReadingGoalContext = createContext(null);

export function ReadingGoalProvider({ children }) {
  const { user } = useAuth();
  const owner = user?.id == null ? 'guest' : String(user.id);
  return <UserReadingGoalProvider key={owner} owner={owner}>{children}</UserReadingGoalProvider>;
}

function UserReadingGoalProvider({ children, owner }) {
  // 기존 공용 키는 소유자를 알 수 없으므로 특정 계정으로 자동 이전하지 않는다.
  const GOALS_KEY = `readingGoals:${owner}`;
  const ACTIVE_KEY = `activeGoalId:${owner}`;
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(GOALS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeGoalId, setActiveGoalId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || null;
  });

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals, GOALS_KEY]);

  useEffect(() => {
    if (activeGoalId) localStorage.setItem(ACTIVE_KEY, String(activeGoalId));
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeGoalId, ACTIVE_KEY]);

  const activeGoal = goals.find((g) => String(g.id) === String(activeGoalId)) || null;

  function createGoal(form) {
    const newGoal = { ...form, id: Date.now(), books: [] };
    setGoals((prev) => [newGoal, ...prev]);
    setActiveGoalId(String(newGoal.id));
    return newGoal;
  }

  function updateGoal(id, updates) {
    setGoals((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, ...updates } : g))
    );
  }

  function deleteGoal(id) {
    setGoals((prev) => prev.filter((g) => String(g.id) !== String(id)));
    if (String(activeGoalId) === String(id)) setActiveGoalId(null);
  }

  function addBookToGoal(goalId, book) {
    setGoals((prev) =>
      prev.map((g) => {
        if (String(g.id) !== String(goalId)) return g;
        if (g.books.some((b) => String(b.id) === String(book.id))) return g;
        if (g.books.length >= g.goalCount) return g;
        return {
          ...g,
          books: [
            ...g.books,
            { id: book.id, title: book.title, author: book.author, poster: book.poster },
          ],
        };
      })
    );
  }

  function removeBookFromGoal(goalId, bookId) {
    setGoals((prev) =>
      prev.map((g) =>
        String(g.id) === String(goalId)
          ? { ...g, books: g.books.filter((b) => String(b.id) !== String(bookId)) }
          : g
      )
    );
  }

  // 책 상세 페이지에서 "완독" 설정 시 호출
  function onBookFinished(book) {
    if (!activeGoal || !activeGoal.autoAdd) return;
    addBookToGoal(activeGoal.id, book);
  }

  return (
    <ReadingGoalContext.Provider
      value={{
        goals,
        activeGoal,
        activeGoalId,
        setActiveGoalId,
        createGoal,
        updateGoal,
        deleteGoal,
        addBookToGoal,
        removeBookFromGoal,
        onBookFinished,
      }}
    >
      {children}
    </ReadingGoalContext.Provider>
  );
}

export function useReadingGoal() {
  return useContext(ReadingGoalContext);
}
