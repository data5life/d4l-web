'use client';
// TODO: Change to sever side rendering later

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useMemo } from 'react';

interface RichTextRendererProps {
  content: string; // JSON string from TipTap
  className?: string;
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const parsedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(content);

      // Recursively fix links to add protocol if missing (immutable)
      const fixLinks = (node: JSONContent): JSONContent => {
        // Create a shallow copy of the node to avoid mutations
        const newNode = { ...node };

        if (newNode.type === 'text' && newNode.marks) {
          newNode.marks = newNode.marks.map((mark) => {
            if (mark.type === 'link' && mark.attrs?.href) {
              const href = mark.attrs.href;
              // Add https:// if no protocol is present
              if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) {
                return {
                  ...mark,
                  attrs: {
                    ...mark.attrs,
                    href: `https://${href}`,
                  },
                };
              }
            }
            return mark;
          });
        }

        if (newNode.content) {
          newNode.content = newNode.content.map(fixLinks);
        }

        return newNode;
      };

      return fixLinks(parsed);
    } catch (err) {
      console.error('Failed to parse rich text content:', err);
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }],
      };
    }
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-violet-600 hover:text-violet-700 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: parsedContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${className}`,
      },
    },
  });

  return (
    <div className="tiptap-content">
      {editor && <EditorContent editor={editor} />}
      <style jsx global>{`
        .tiptap-content .ProseMirror {
          outline: none;
        }
        .tiptap-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .tiptap-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .tiptap-content p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        .tiptap-content ul,
        .tiptap-content ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
          color: #4b5563;
        }
        .tiptap-content ul {
          list-style-type: disc;
        }
        .tiptap-content ol {
          list-style-type: decimal;
        }
        .tiptap-content li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .tiptap-content strong {
          font-weight: 600;
        }
        .tiptap-content em {
          font-style: italic;
        }
        .tiptap-content a {
          color: #7c3aed;
          text-decoration: underline;
        }
        .tiptap-content a:hover {
          color: #6d28d9;
        }
      `}</style>
    </div>
  );
}
