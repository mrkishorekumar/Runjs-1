import SearchInput from '../components/SearchInput';
import Badge from '../components/Badge';
import { useEffect, useRef, useState } from 'react';
import { ModalRef, Tag, UserCodeBase } from '../utils/interface';
import { getAllCodes } from '../db/operations';
import ProjectTable from '../components/ProjectTable';
import CreatePlayground from '../components/CreatePlayground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { Star, FolderCode, Tag as TagIcon } from 'lucide-react';

function Dashboard() {
  const [userSavedCode, setUserSavedCode] = useState<UserCodeBase[]>([]);
  const [filterData, setFilterData] = useState<UserCodeBase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFavouriteSelected, setIsFavouriteSelected] = useState(false);
  const [tag, setTags] = useState<Tag>({});
  const [isLoading, setIsLoading] = useState(true);
  const dialogRef = useRef<ModalRef>(null);

  async function dbcall() {
    try {
      const dbResult = await getAllCodes();
      const filterIsnotDeleted = dbResult.filter(
        (val) => val.isDelete === false
      );
      const tagHashMap: Tag = {};
      filterIsnotDeleted.forEach((val) => {
        const cleanTag = val.tag?.trim();
        if (cleanTag) {
          tagHashMap[cleanTag] = (tagHashMap[cleanTag] ?? 0) + 1;
        }
      });
      setUserSavedCode(filterIsnotDeleted);
      setFilterData(filterIsnotDeleted);
      setTags(tagHashMap);
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

  function filterFavouriteCode() {
    if (isFavouriteSelected) {
      const filter = userSavedCode.filter((val) => val.star === 1);
      return setFilterData(filter);
    } else {
      return setFilterData(userSavedCode);
    }
  }

  function filterList() {
    setIsFavouriteSelected(false);
    if (searchTerm === '') {
      return setFilterData(userSavedCode);
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filter = userSavedCode.filter(
      (val) =>
        val.fileName.toLowerCase().includes(lowerSearch) ||
        (val.tag && val.tag.toLowerCase().includes(lowerSearch))
    );
    return setFilterData(filter);
  }

  useEffect(() => {
    filterList();
  }, [searchTerm]);

  useEffect(() => {
    filterFavouriteCode();
  }, [isFavouriteSelected]);

  function onInputChange(text: string) {
    setSearchTerm(text);
  }

  const totalCount = userSavedCode.length;
  const starredCount = userSavedCode.filter((c) => c.star === 1).length;
  const jsCount = userSavedCode.filter((c) => c.language === 'js').length;
  const tsCount = userSavedCode.filter((c) => c.language === 'ts').length;
  const reactCount = userSavedCode.filter((c) => c.language === 'react').length;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="Workspace Dashboard"
        description="Manage your local RunJS projects, code snippets, and interview solutions."
        noIndex={true}
        noFollow={true}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Workspace & Playgrounds
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage your local projects, code snippets, and interview
              solutions.
            </p>
          </div>

          {/* Metrics Telemetry Bar */}
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-md overflow-x-auto [scrollbar-width:none] shrink-0 max-w-full">
            <span className="flex items-center gap-1.5">
              <FolderCode className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[var(--text-muted)]">total:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {totalCount}
              </span>
            </span>
            <span className="text-[var(--border-default)]">|</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[var(--text-muted)]">starred:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {starredCount}
              </span>
            </span>
            <span className="text-[var(--border-default)]">|</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span className="text-[var(--text-muted)]">react:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {reactCount}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[var(--text-muted)]">js:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {jsCount}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[var(--text-muted)]">ts:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {tsCount}
                </span>
              </span>
            </span>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <SearchInput
          showFavourite={filterData.length === 0 && userSavedCode.length === 0}
          isFavouriteSelected={isFavouriteSelected}
          setIsFavouriteSelected={setIsFavouriteSelected}
          searchTerm={searchTerm}
          dialogRef={dialogRef}
          onInputChange={onInputChange}
        />

        {/* Tag Filters */}
        {Object.keys(tag).length > 0 && (
          <section className="flex items-center gap-2 flex-wrap my-3 text-xs">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 opacity-70" />
              Tags:
            </span>
            {Object.keys(tag).map((val, index) => (
              <Badge
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                key={index}
                tag={val}
                count={tag[val]}
              />
            ))}
          </section>
        )}

        {/* Playgrounds Data Table */}
        <ProjectTable
          tagSuggestions={Object.keys(tag)}
          dbcall={dbcall}
          data={filterData}
          bin={false}
          createPlayground={() => dialogRef?.current?.open()}
          isLoading={isLoading}
        />
      </main>

      {/* Create / Rename Modal */}
      <CreatePlayground
        edit={false}
        ref={dialogRef}
        tagSuggestions={Object.keys(tag)}
        dbcall={dbcall}
      />

      <Footer />
    </div>
  );
}

export default Dashboard;
