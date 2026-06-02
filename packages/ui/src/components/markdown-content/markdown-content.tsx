import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "../../lib/utils";
import styles from "./markdown-content.module.css";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

export type MarkdownContentProps = {
  markdown: string;
  className?: string;
};

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  const trimmed = markdown.trim();
  if (!trimmed) return null;

  return (
    <div className={cn(styles.root, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
