// VersionInfo component
// Reads version data from window.__APP_VERSION__ / window.__BUILD_TIME__ / window.__GIT_COMMIT__
// injected by inject-version.js into index.html.
// Using window property access prevents Rollup from tree-shaking the reads.
export default function VersionInfo() {
  const v = window.__APP_VERSION__;
  const b = window.__BUILD_TIME__;
  const c = window.__GIT_COMMIT__;
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        版本信息
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 w-20">版本：</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{v}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 w-20">构建：</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{b}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 w-20">Commit：</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{c}</span>
        </div>
      </div>
    </section>
  );
}
