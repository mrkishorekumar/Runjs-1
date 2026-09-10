import ProjectTable from '../components/ProjectTable';
import { useEffect, useState } from 'react';
import { UserCodeBase } from '../utils/interface';
import { getAllCodes } from '../db/operations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router';
import SEO from '../seo/SEO';
import { Trash2, AlertCircle, ArrowLeft } from 'lucide-react';

function Bin() {
  const [userSavedCode, setUserSavedCode] = useState<UserCodeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function dbcall() {
    try {
      const dbResult = await getAllCodes();
      const filterIsnotDeleted = dbResult.filter(
        (val) => val.isDelete === true
      );
      setUserSavedCode(filterIsnotDeleted);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchUserSavedCode() {
      await dbcall();
    }
    fetchUserSavedCode();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="Recently Deleted Items"
        description="View and restore recently deleted playgrounds and code snippets."
        noIndex={true}
        noFollow={true}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              title="Back to Dashboard"
              aria-label="Back to Dashboard"
              className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Recently Deleted
                </h1>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Items in the trash can be restored or permanently removed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-secondary)]">
            <span>deleted:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {userSavedCode.length}
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        {userSavedCode.length > 0 && (
          <div className="my-4 p-3 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>
              Items in the trash are preserved locally in IndexedDB until you
              choose to permanently delete them.
            </p>
          </div>
        )}

        {/* Trashed Items Table */}
        <ProjectTable
          tagSuggestions={[]}
          dbcall={dbcall}
          data={userSavedCode}
          bin={true}
          isLoading={isLoading}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Bin;
