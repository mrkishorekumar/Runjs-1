import {
  FormEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IModalProps, UserCodeBase } from '../utils/interface';
import { addCode, updateCode } from '../db/operations';
import { useNavigate } from 'react-router';
import { X, Tag as TagIcon, Check } from 'lucide-react';

import {
  VITE_REACT_TEMPLATE,
  VITE_REACT_TS_TEMPLATE,
} from '../ide/templates/defaultTemplates';

interface LanguageOption {
  id: 'js' | 'ts' | 'react' | 'html';
  label: string;
  description: string;
  textColorClass: string;
  activeBorderClass: string;
  activeBgClass: string;
  activeRingClass: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'html',
    label: 'HTML/CSS/JS',
    description: 'CodePen-style live browser sandbox',
    textColorClass: 'text-orange-600 dark:text-orange-400',
    activeBorderClass: 'border-orange-500',
    activeBgClass: 'bg-orange-500/10',
    activeRingClass: 'ring-orange-500',
  },
  {
    id: 'js',
    label: 'JavaScript',
    description: 'ES6+, Web APIs, standard runtime',
    textColorClass: 'text-amber-600 dark:text-amber-400',
    activeBorderClass: 'border-amber-500',
    activeBgClass: 'bg-amber-500/10',
    activeRingClass: 'ring-amber-500',
  },
  {
    id: 'ts',
    label: 'TypeScript',
    description: 'Types, esbuild compilation',
    textColorClass: 'text-blue-600 dark:text-blue-400',
    activeBorderClass: 'border-blue-500',
    activeBgClass: 'bg-blue-500/10',
    activeRingClass: 'ring-blue-500',
  },
  {
    id: 'react',
    label: 'React + Vite',
    description: 'Live HMR, Multi-file, NPM terminal',
    textColorClass: 'text-cyan-600 dark:text-cyan-400',
    activeBorderClass: 'border-cyan-500',
    activeBgClass: 'bg-cyan-500/10',
    activeRingClass: 'ring-cyan-500',
  },
];

interface LanguageCardProps {
  option: LanguageOption;
  isSelected: boolean;
  onSelect: (id: 'js' | 'ts' | 'react' | 'html') => void;
}

function LanguageCard({ option, isSelected, onSelect }: LanguageCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-colors cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
        isSelected
          ? `${option.activeBorderClass} ${option.activeBgClass} text-[var(--text-primary)] ring-1 ${option.activeRingClass}`
          : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-0.5">
        <span className={`font-mono font-medium text-xs ${option.textColorClass}`}>
          {option.label}
        </span>
        {isSelected && (
          <Check className={`w-3.5 h-3.5 ${option.textColorClass}`} />
        )}
      </div>
      <span className="text-[10px] text-[var(--text-muted)] leading-tight">
        {option.description}
      </span>
    </button>
  );
}

const CreatePlayground = ({
  tagSuggestions,
  edit,
  renameData,
  dbcall,
  ref,
}: IModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const [tagName, setTag] = useState('');
  const [fileName, setFileName] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [lang, setLang] = useState<'js' | 'ts' | 'react' | 'html'>('js');
  const [reactFlavor, setReactFlavor] = useState<'js' | 'ts'>('js');

  useEffect(() => {
    setTag(renameData?.tag ?? '');
    setFileName(renameData?.fileName ?? '');
    setLang(renameData?.language ?? 'js');
    setFilteredSuggestions([]);
  }, [renameData]);

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }));

  async function updateProjectInfo() {
    if (renameData) {
      try {
        const updatePayload: UserCodeBase = {
          ...renameData,
          fileName: fileName.trim() || 'untitled',
          tag: tagName.trim(),
        };
        await updateCode(renameData.id, updatePayload);
        if (dbcall) await dbcall();
        dialogRef.current?.close();
      } catch (error) {
        console.log('Error', error);
      }
    }
  }

  async function createNewPlayGroundFunction(e: FormEvent) {
    e.preventDefault();
    if (edit) {
      await updateProjectInfo();
      return;
    }
    const id = uuidv4();
    const cleanFileName =
      fileName.trim() ||
      (lang === 'ts'
        ? 'main'
        : lang === 'react'
          ? 'react-app'
          : lang === 'html'
            ? 'web-playground'
            : 'script');

    let newCode: UserCodeBase;

    if (lang === 'react') {
      const selectedTemplate =
        reactFlavor === 'ts' ? VITE_REACT_TS_TEMPLATE : VITE_REACT_TEMPLATE;
      const mainAppFile =
        reactFlavor === 'ts' ? '/src/App.tsx' : '/src/App.jsx';
      newCode = {
        id: id,
        code: selectedTemplate.files[mainAppFile],
        htmlCode: selectedTemplate.files['/index.html'],
        cssCode: selectedTemplate.files['/src/App.css'] || '',
        jsCode: selectedTemplate.files[mainAppFile],
        createdAt: new Date(),
        fileName: cleanFileName,
        isDelete: false,
        language: 'react',
        lastModifiedAt: new Date(),
        star: 0,
        tag: tagName.trim() || (reactFlavor === 'ts' ? 'react-ts' : 'react'),
        dbUpload: false,
        files: selectedTemplate.files,
        activeFile: selectedTemplate.activeFile,
        openFiles: selectedTemplate.openFiles,
        template: reactFlavor === 'ts' ? 'vite-react-ts' : 'vite-react',
      };
    } else if (lang === 'html') {
      newCode = {
        id: id,
        code: `console.log("Hello from RunJS HTML/CSS/JS Playground!");\n\nlet count = 0;\nconst button = document.getElementById("counter-btn");\n\nif (button) {\n  button.addEventListener("click", () => {\n    count++;\n    button.textContent = \`Clicks: \${count}\`;\n    console.log(\`Button clicked! New count: \${count}\`);\n  });\n}\n`,
        htmlCode: `<div class="container">\n  <h1>Hello RunJS</h1>\n  <p>Start coding with HTML, CSS, and JavaScript...</p>\n  <button id="counter-btn">Clicks: 0</button>\n</div>`,
        cssCode: `body {\n  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  padding: 2rem;\n  background: #f8fafc;\n  color: #1e293b;\n  margin: 0;\n}\n\n.container {\n  max-width: 600px;\n  margin: 0 auto;\n  background: white;\n  padding: 2rem;\n  border-radius: 12px;\n  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\n}\n\nh1 {\n  color: #ea580c;\n  margin-top: 0;\n}\n\np {\n  line-height: 1.6;\n  color: #64748b;\n}\n\nbutton {\n  background: #ea580c;\n  color: white;\n  border: none;\n  padding: 0.6rem 1.2rem;\n  border-radius: 8px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\nbutton:hover {\n  background: #c2410c;\n}`,
        jsCode: `console.log("Hello from RunJS HTML/CSS/JS Playground!");\n\nlet count = 0;\nconst button = document.getElementById("counter-btn");\n\nif (button) {\n  button.addEventListener("click", () => {\n    count++;\n    button.textContent = \`Clicks: \${count}\`;\n    console.log(\`Button clicked! New count: \${count}\`);\n  });\n}\n`,
        createdAt: new Date(),
        fileName: cleanFileName,
        isDelete: false,
        language: 'html',
        lastModifiedAt: new Date(),
        star: 0,
        tag: tagName.trim() || 'html',
        dbUpload: false,
      };
    } else {
      newCode = {
        id: id,
        code:
          lang === 'ts'
            ? `// RunJS TypeScript Playground\ninterface Greeting {\n  message: string;\n  date: Date;\n}\n\nconst greet: Greeting = {\n  message: "Hello from RunJS TypeScript!",\n  date: new Date()\n};\n\nconsole.log(greet.message);\nconsole.log("Current time:", greet.date.toLocaleTimeString());\n`
            : `// RunJS JavaScript Playground\nconsole.log("Hello from RunJS!");\n\nconst numbers = [1, 2, 3, 4, 5];\nconst squared = numbers.map(n => n ** 2);\nconsole.log("Squared numbers:", squared);\n`,
        htmlCode: '',
        cssCode: '',
        jsCode: '',
        createdAt: new Date(),
        fileName: cleanFileName,
        isDelete: false,
        language: lang,
        lastModifiedAt: new Date(),
        star: 0,
        tag: tagName.trim(),
        dbUpload: false,
      };
    }

    try {
      await addCode(newCode);
      dialogRef.current?.close();
      return navigate(`/${lang}/${id}`);
    } catch (error) {
      console.log('Error', error);
    }
  }

  function handleInputChange(term: string) {
    if (term) {
      const filtered = tagSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTag(suggestion);
    setFilteredSuggestions([]);
  };

  const handleClose = () => {
    setTag(renameData?.tag ?? '');
    setFileName(renameData?.fileName ?? '');
    setLang(renameData?.language ?? 'js');
    setFilteredSuggestions([]);
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg w-[calc(100%-2rem)] max-w-md p-0 shadow-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop:bg-black/60 backdrop:backdrop-blur-xs text-[var(--text-primary)]"
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose();
        }
      }}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded border border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-xs font-bold">
              &gt;_
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {edit ? 'Rename Playground' : 'New Playground'}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {edit
                  ? 'Update playground name and tag'
                  : 'Configure project runtime and metadata'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={createNewPlayGroundFunction} className="mt-4 space-y-3.5">
          {/* File Name Field */}
          <div>
            <label
              htmlFor="playground-name"
              className="block text-xs font-mono text-[var(--text-secondary)] mb-1"
            >
              Playground Name
            </label>
            <input
              id="playground-name"
              autoFocus
              maxLength={50}
              placeholder="e.g. array-methods, async-fetch"
              className="w-full h-8 px-2.5 text-xs font-mono rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              type="text"
              required
            />
          </div>

          {/* Tag Field */}
          <div className="relative">
            <label
              htmlFor="playground-tag"
              className="block text-xs font-mono text-[var(--text-secondary)] mb-1"
            >
              Tag / Category{' '}
              <span className="text-[var(--text-muted)] text-[11px]">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                <TagIcon className="w-3.5 h-3.5" />
              </div>
              <input
                id="playground-tag"
                maxLength={50}
                placeholder="e.g. algorithms, interview, react"
                className="w-full h-8 pl-8 pr-2.5 text-xs font-mono rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                value={tagName}
                onChange={(e) => {
                  setTag(e.target.value.toLowerCase());
                  handleInputChange(e.target.value.toLowerCase());
                }}
                type="text"
              />
            </div>

            {/* Tag Suggestions Dropdown */}
            {filteredSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 max-h-36 overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1 shadow-lg">
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded cursor-pointer transition-colors"
                  >
                    <TagIcon className="w-3 h-3 text-amber-500 opacity-70" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Language Selector Cards (Only in create mode) */}
          {!edit && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  Runtime / Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <LanguageCard
                      key={option.id}
                      option={option}
                      isSelected={lang === option.id}
                      onSelect={(selectedLang) => setLang(selectedLang)}
                    />
                  ))}
                </div>
              </div>

              {lang === 'react' && (
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                    Template Variant
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReactFlavor('js')}
                      className={`px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 ${
                        reactFlavor === 'js'
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-mono font-medium ring-1 ring-cyan-500/30'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] font-mono'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>JavaScript (JSX)</span>
                        {reactFlavor === 'js' && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReactFlavor('ts')}
                      className={`px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 ${
                        reactFlavor === 'ts'
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-mono font-medium ring-1 ring-cyan-500/30'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] font-mono'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>TypeScript (TSX)</span>
                        {reactFlavor === 'ts' && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              {edit ? 'Save Changes' : 'Create Playground'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default CreatePlayground;
