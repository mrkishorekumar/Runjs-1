import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProblemsetTable from '../components/ProblemsetTable';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemStatsBanner from '../components/problems/ProblemStatsBanner';
import { PROBLEMS } from '../problem-engine/data/problems';
import { Difficulty, ProblemFilterStatus } from '../problem-engine/types';
import {
  getAllProblemStates,
  toggleProblemStar,
} from '../problem-engine/storage';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getCanonicalUrl } from '../seo/seoConfig';
import { Code2 } from 'lucide-react';

function Problemset() {
  const navigate = useNavigate();
  const [userStates, setUserStates] = useState(getAllProblemStates());
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | Difficulty>('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [status, setStatus] = useState<ProblemFilterStatus>('all');

  // Reload user states on focus/mount
  useEffect(() => {
    setUserStates(getAllProblemStates());
  }, []);

  const handleToggleStar = useCallback((slug: string) => {
    toggleProblemStar(slug);
    setUserStates(getAllProblemStates());
  }, []);

  // Compute all available unique topics
  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    for (const p of PROBLEMS) {
      for (const t of p.topics) {
        topicSet.add(t);
      }
    }
    return Array.from(topicSet).sort();
  }, []);

  // Compute total counts for badges
  const totalCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let solved = 0;
    let starred = 0;

    for (const p of PROBLEMS) {
      if (p.difficulty === 'easy') easy++;
      if (p.difficulty === 'medium') medium++;
      if (p.difficulty === 'hard') hard++;

      const st = userStates[p.slug];
      if (st?.isSolved) solved++;
      if (st?.isStarred) starred++;
    }

    return {
      all: PROBLEMS.length,
      easy,
      medium,
      hard,
      solved,
      starred,
    };
  }, [userStates]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter((problem) => {
      const state = userStates[problem.slug];
      const isSolved = state?.isSolved ?? false;
      const isStarred = state?.isStarred ?? false;

      // Status filter
      if (status === 'solved' && !isSolved) return false;
      if (status === 'unsolved' && isSolved) return false;
      if (status === 'starred' && !isStarred) return false;

      // Difficulty filter
      if (difficulty !== 'all' && problem.difficulty !== difficulty) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== 'all' && !problem.topics.includes(selectedTopic)) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = problem.title.toLowerCase().includes(query);
        const matchesId = problem.id.includes(query);
        const matchesTopic = problem.topics.some((t) =>
          t.toLowerCase().includes(query)
        );
        const matchesDesc = problem.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesId && !matchesTopic && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [search, difficulty, selectedTopic, status, userStates]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setDifficulty('all');
    setSelectedTopic('all');
    setStatus('all');
  }, []);

  const handlePickRandom = useCallback(() => {
    if (PROBLEMS.length === 0) return;
    const randomIndex = Math.floor(Math.random() * PROBLEMS.length);
    const randomProblem = PROBLEMS[randomIndex];
    navigate(`/problems/${randomProblem.slug}`);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="JavaScript Coding Challenges & Algorithm Practice"
        description="Practice JavaScript algorithms, data structures, closures, promises, and polyfills with instant in-browser test execution, hints, and complexity analysis."
        canonical="/problems"
        keywords={[
          'JavaScript coding challenges',
          'JS algorithms',
          'LeetCode JavaScript',
          'JavaScript problem solving',
          'frontend interview prep',
          'JavaScript polyfills',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Problems', item: '/problems' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'JavaScript Coding Challenges & Algorithm Practice',
            url: getCanonicalUrl('/problems'),
            description:
              'Practice JavaScript algorithms, data structures, closures, and promises with instant test runner.',
          },
        ]}
      />

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="pb-4 border-b border-[var(--border-default)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                JavaScript Coding Challenges
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">
                Practice foundational algorithms, data structures, closures,
                promises, debounce, and polyfills with instant in-browser test
                execution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-secondary)]">
                <Code2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{PROBLEMS.length} challenges</span>
              </span>
            </div>
          </div>
        </div>

        {/* User Progress Stats Banner */}
        <div className="mt-6">
          <ProblemStatsBanner
            problems={PROBLEMS}
            onPickRandom={handlePickRandom}
          />
        </div>

        {/* Filters and Search Bar */}
        <ProblemFilters
          search={search}
          onSearchChange={setSearch}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
          status={status}
          onStatusChange={setStatus}
          availableTopics={availableTopics}
          totalCounts={totalCounts}
          onResetFilters={handleResetFilters}
        />

        {/* Problems Table */}
        <ProblemsetTable
          problems={filteredProblems}
          userStates={userStates}
          onToggleStar={handleToggleStar}
          onTopicClick={(topic) => setSelectedTopic(topic)}
          onResetFilters={handleResetFilters}
        />
      </main>

      <Footer />
    </div>
  );
}

export default memo(Problemset);
