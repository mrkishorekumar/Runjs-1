import { Fragment, memo, useRef, useState } from 'react';
import { IProjectTable, ModalRef, UserCodeBase } from '../utils/interface';
import { Link } from 'react-router';
import { getReactFlavor, saveJSTSFile } from '../utils/commonFunction';
import { deleteCode, updateCode } from '../db/operations';
import CreatePlayground from './CreatePlayground';
import HTMLDashboardPreviewModal from './html-playground/HTMLDashboardPreviewModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import IOSSpinner from './IOSSpinner';
import {
  Star,
  Download,
  Edit3,
  Trash2,
  RotateCcw,
  Plus,
  Play,
  Clock,
  Tag as TagIcon,
  FolderOpen,
  Eye,
  RotateCw,
} from 'lucide-react';

function ProjectTable({
  data,
  bin,
  createPlayground,
  dbcall,
  tagSuggestions,
  isLoading,
}: IProjectTable) {
  const dialogRef = useRef<ModalRef>(null);
  const [renameData, setRenameData] = useState<UserCodeBase>();
  const [previewProject, setPreviewProject] = useState<UserCodeBase | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<UserCodeBase | null>(null);

  async function handleDownload(val: UserCodeBase) {
    if (val.language === 'react' && val.files) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const [filePath, content] of Object.entries(val.files)) {
          const relPath = filePath.startsWith('/')
            ? filePath.slice(1)
            : filePath;
          zip.file(relPath, content);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${val.fileName || 'react-project'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.error('Failed to download React zip:', e);
      }
    } else if (val.language === 'html') {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        const htmlContent = val.htmlCode || '';
        const cssContent = val.cssCode || '';
        const jsContent = val.jsCode || val.code || '';

        let entryHtml = htmlContent;
        if (cssContent && !entryHtml.includes('style.css')) {
          if (entryHtml.includes('</head>')) {
            entryHtml = entryHtml.replace(
              '</head>',
              '  <link rel="stylesheet" href="style.css">\n</head>'
            );
          } else {
            entryHtml =
              `<link rel="stylesheet" href="style.css">\n` + entryHtml;
          }
        }
        if (jsContent && !entryHtml.includes('script.js')) {
          if (entryHtml.includes('</body>')) {
            entryHtml = entryHtml.replace(
              '</body>',
              '  <script src="script.js"></script>\n</body>'
            );
          } else {
            entryHtml = entryHtml + `\n<script src="script.js"></script>`;
          }
        }

        zip.file('index.html', entryHtml);
        zip.file('style.css', cssContent);
        zip.file('script.js', jsContent);

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${val.fileName || 'html-project'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.error('Failed to download HTML zip:', e);
      }
    } else if (val.language === 'js' || val.language === 'ts') {
      saveJSTSFile(val.code, val.fileName, val.language);
    }
  }

  async function handleFavorite(val: UserCodeBase) {
    const updatePayload: UserCodeBase = {
      ...val,
      star: val.star === 1 ? 0 : 1,
    };
    try {
      await updateCode(val.id, updatePayload);
      await dbcall();
    } catch (error) {
      console.log('Error', error);
    }
  }

  async function handleDelete(val: UserCodeBase) {
    const updatePayload: UserCodeBase = {
      ...val,
      isDelete: !val.isDelete,
    };
    try {
      await updateCode(val.id, updatePayload);
      await dbcall();
    } catch (error) {
      console.log('Error', error);
    }
  }

  async function handleExecuteDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCode(deleteTarget.id);
      await dbcall();
      setDeleteTarget(null);
    } catch (error) {
      console.log('Error', error);
    }
  }

  const getLanguageBadge = (valOrLang: UserCodeBase | string) => {
    const lang = typeof valOrLang === 'string' ? valOrLang : valOrLang.language;
    const project = typeof valOrLang === 'object' ? valOrLang : undefined;

    switch (lang) {
      case 'react': {
        const flavor = project ? getReactFlavor(project) : 'jsx';
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 w-fit shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            react ({flavor})
          </span>
        );
      }
      case 'js':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            javascript
          </span>
        );
      case 'ts':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 w-fit shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            typescript
          </span>
        );
      case 'html':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 w-fit shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            html/css/js
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 w-fit shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            {lang.toLowerCase()}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 my-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
        <IOSSpinner size="md" />
        <span className="text-xs text-[var(--text-muted)] mt-2.5">
          {bin ? 'Loading trash...' : 'Loading playgrounds...'}
        </span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center my-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
          <FolderOpen className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
          {bin ? 'Trash is empty' : 'No playgrounds found'}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {bin
            ? 'Deleted playgrounds will appear here before permanent removal.'
            : 'Get started by creating a new JavaScript or TypeScript playground.'}
        </p>
        <div className="mt-5">
          {bin ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Back to Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={createPlayground}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-amber-600 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Playground</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] my-4 shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-default)] text-left text-xs">
            <thead className="bg-[var(--bg-surface-muted)] text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">
                  Playground
                </th>
                <th scope="col" className="px-3.5 py-2.5 hidden sm:table-cell">
                  Language
                </th>
                <th scope="col" className="px-3.5 py-2.5 hidden md:table-cell">
                  Tag
                </th>
                <th scope="col" className="px-3.5 py-2.5 hidden lg:table-cell">
                  Modified
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
              {data.map((val) => {
                const targetUrl = `/${val.language}/${val.id}`;
                const formattedDate = new Date(
                  val.lastModifiedAt
                ).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={val.id}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors group"
                  >
                    {/* Playground Name / Link */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {!bin && (
                          <button
                            type="button"
                            onClick={() => handleFavorite(val)}
                            title={val.star === 1 ? 'Unstar' : 'Star'}
                            aria-label="Star playground"
                            className="text-[var(--text-muted)] hover:text-amber-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 rounded-sm cursor-pointer shrink-0"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                val.star === 1
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            />
                          </button>
                        )}
                        <div className="min-w-0">
                          {bin ? (
                            <div className="font-mono text-xs text-[var(--text-secondary)] flex items-center gap-1 cursor-not-allowed select-none min-w-0">
                              <span className="font-medium truncate max-w-[180px] sm:max-w-xs">
                                {val.fileName}
                              </span>
                              <span className="text-[var(--text-muted)] text-[11px] shrink-0">
                                .
                                {val.language === 'react'
                                  ? getReactFlavor(val)
                                  : val.language}
                              </span>
                            </div>
                          ) : (
                            <Link
                              to={targetUrl}
                              className="font-mono text-xs flex items-center gap-1 group/link min-w-0"
                            >
                              <span className="font-medium text-[var(--text-primary)] group-hover/link:text-amber-500 transition-colors truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                                {val.fileName}
                              </span>
                              <span className="text-[var(--text-muted)] text-[11px] shrink-0">
                                .
                                {val.language === 'react'
                                  ? getReactFlavor(val)
                                  : val.language}
                              </span>
                            </Link>
                          )}
                          <div className="sm:hidden mt-1 flex items-center gap-2">
                            {getLanguageBadge(val)}
                            {val.tag && (
                              <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[120px]">
                                #{val.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="px-3.5 py-2.5 hidden sm:table-cell">
                      {getLanguageBadge(val)}
                    </td>

                    {/* Tag */}
                    <td className="px-3.5 py-2.5 hidden md:table-cell">
                      {val.tag ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                          <TagIcon className="w-3 h-3 opacity-60" />
                          <span>{val.tag}</span>
                        </span>
                      ) : val.language === 'react' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                          <TagIcon className="w-3 h-3 opacity-60" />
                          <span>{getReactFlavor(val)}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] font-mono text-[11px]">
                          —
                        </span>
                      )}
                    </td>

                    {/* Last Modified */}
                    <td className="px-3.5 py-2.5 hidden lg:table-cell text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {!bin ? (
                          <Fragment>
                            {/* Live Preview for HTML */}
                            {val.language === 'html' && (
                              <button
                                type="button"
                                onClick={() => setPreviewProject(val)}
                                title="Live Preview"
                                aria-label="Live Preview"
                                className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-orange-500 hover:bg-orange-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Visualize in JS Visualizer */}
                            {val.language === 'js' && (
                              <Link
                                to="/visualizer"
                                state={{ code: val.code }}
                                onClick={() => {
                                  try {
                                    sessionStorage.setItem(
                                      'runjs_visualizer_code',
                                      val.code || ''
                                    );
                                  } catch {
                                    // ignore
                                  }
                                }}
                                title="Visualize in JS Visualizer"
                                aria-label="Visualize in JS Visualizer"
                                className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-purple-500 hover:bg-purple-500/10 transition-colors cursor-pointer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Run Link */}
                            <Link
                              to={targetUrl}
                              title="Open Editor"
                              aria-label="Open Editor"
                              className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </Link>

                            {/* Download */}
                            <button
                              type="button"
                              onClick={() => handleDownload(val)}
                              title="Download File"
                              aria-label="Download File"
                              className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={() => {
                                setRenameData(val);
                                dialogRef?.current?.open();
                              }}
                              title="Rename / Edit Tag"
                              aria-label="Rename"
                              className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Move to Bin */}
                            <button
                              type="button"
                              onClick={() => handleDelete(val)}
                              title="Move to Bin"
                              aria-label="Move to Bin"
                              className="p-1.5 sm:p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Fragment>
                        ) : (
                          <Fragment>
                            {/* Restore */}
                            <button
                              type="button"
                              onClick={() => handleDelete(val)}
                              title="Restore Playground"
                              aria-label="Restore"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] transition-colors border border-[var(--border-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Restore</span>
                            </button>

                            {/* Permanent Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(val)}
                              title="Delete Forever"
                              aria-label="Delete Forever"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </Fragment>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePlayground
        dbcall={dbcall}
        renameData={renameData}
        edit={true}
        ref={dialogRef}
        tagSuggestions={tagSuggestions}
      />

      <HTMLDashboardPreviewModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        projectName={deleteTarget?.fileName}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
      />
    </Fragment>
  );
}

export default memo(ProjectTable);
