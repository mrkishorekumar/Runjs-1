import { memo } from 'react';
import { Link } from 'react-router';
import { ISearchInput } from '../utils/interface';
import { Search, Plus, Star, Trash2, X } from 'lucide-react';

function SearchInput({
  showFavourite,
  isFavouriteSelected,
  dialogRef,
  onInputChange,
  searchTerm,
  setIsFavouriteSelected,
}: ISearchInput) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between my-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <label htmlFor="search-playgrounds" className="sr-only">
          Search playgrounds
        </label>

        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--text-muted)]">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          id="search-playgrounds"
          type="text"
          value={searchTerm}
          onChange={(e) => onInputChange(e.target.value.toLowerCase())}
          placeholder="Search playgrounds by name or tag..."
          className="w-full h-8 pl-8 pr-8 text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        />

        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onInputChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Favorite Filter Toggle */}
        {!showFavourite && (
          <button
            type="button"
            title={
              isFavouriteSelected ? 'Show all playgrounds' : 'Show starred only'
            }
            onClick={() => setIsFavouriteSelected((prev) => !prev)}
            className={`h-8 flex items-center gap-1.5 px-2.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              isFavouriteSelected
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavouriteSelected
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-[var(--text-secondary)]'
              }`}
            />
            <span className="hidden sm:inline">
              {isFavouriteSelected ? 'Starred' : 'Favorites'}
            </span>
          </button>
        )}

        {/* Bin Link */}
        <Link
          to="/bin"
          title="Recently deleted items"
          className="h-8 flex items-center gap-1.5 px-2.5 text-xs font-medium rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bin</span>
        </Link>

        {/* Create New Playground Button */}
        <button
          type="button"
          onClick={() => dialogRef?.current?.open()}
          className="h-8 flex items-center gap-1.5 px-3 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Playground</span>
        </button>
      </div>
    </div>
  );
}

export default memo(SearchInput);
