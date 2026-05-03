// src/components/MarkdownRenderer.jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return <span className="text-gray-400 text-sm">无内容</span>;
  }

  return (
    <div className="prose dark:prose-invert max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 代码块语法高亮
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && language) {
              return (
                <div className="relative group my-2">
                  <div className="absolute top-0 left-0 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-br z-10">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-md !text-xs"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className={`${className} bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 表格样式
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-left font-medium text-xs">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs">
                {children}
              </td>
            );
          },
          // 任务列表样式
          li({ children, ...props }) {
            return (
              <li className="list-none" {...props}>
                {children}
              </li>
            );
          },
          // 引用块
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 my-2 text-gray-600 dark:text-gray-300 italic">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
