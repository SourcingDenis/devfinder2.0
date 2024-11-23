import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { X } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  readme: string | null;
  username: string;
}

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), 'align', 'className'],
    p: [...(defaultSchema.attributes?.p || []), 'align'],
    img: [
      ...(defaultSchema.attributes?.img || []),
      'align',
      'alt',
      'height',
      'src',
      'width',
      'loading',
      'className',
    ],
    a: [...(defaultSchema.attributes?.a || []), 'href', 'target', 'rel', 'className'],
    td: [...(defaultSchema.attributes?.td || []), 'align', 'width'],
    th: [...(defaultSchema.attributes?.th || []), 'align', 'width'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'div',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'br',
    'strong',
    'em',
    'code',
    'pre',
    'blockquote',
    'hr',
  ],
};

const hasSkillIcons = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false;
  
  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src || '';
    return src.includes('skillicons.dev') || src.includes('techstack-generator.vercel.app');
  }
  
  if (Array.isArray(node.children)) {
    return node.children.some((child: any) => hasSkillIcons(child));
  }
  
  return false;
};

const components = {
  img: ({ node, ...props }: any) => {
    if (props.src?.includes('shields.io') || 
        props.src?.includes('custom-icon-badges') ||
        props.src?.includes('readme-typing-svg') ||
        props.src?.includes('skillicons.dev') ||
        props.src?.includes('techstack-generator.vercel.app')) {
      return (
        <img
          {...props}
          className="inline-block max-h-8 w-auto mx-0.5 my-0.5"
          loading="lazy"
          alt={props.alt || 'Badge'}
        />
      );
    }
    
    return (
      <img
        {...props}
        className="max-w-full h-auto rounded-lg"
        loading="lazy"
        alt={props.alt || 'Image'}
      />
    );
  },
  p: ({ node, children, ...props }: any) => {
    const containsOnlyBadges = React.Children.toArray(children).every(
      (child: any) => 
        child.type === 'img' || 
        (typeof child === 'string' && child.trim() === '')
    );

    if (containsOnlyBadges) {
      return (
        <div className="flex flex-wrap gap-2 my-4 justify-center" {...props}>
          {children}
        </div>
      );
    }

    if (props.align === 'center') {
      return (
        <div className="text-center my-4">
          {children}
        </div>
      );
    }

    return <p className="my-4" {...props}>{children}</p>;
  },
  table: ({ node, ...props }: any) => {
    const containsSkillIcons = hasSkillIcons(node);

    if (containsSkillIcons) {
      return (
        <div className="my-8 overflow-x-auto">
          <table className="mx-auto border-collapse" {...props} />
        </div>
      );
    }

    return (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-border" {...props} />
      </div>
    );
  },
  td: ({ node, ...props }: any) => {
    const align = props.align || 'left';
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

    return (
      <td 
        className={`p-2 border border-border ${alignClass}`}
        {...props}
      />
    );
  },
  th: ({ node, ...props }: any) => {
    const align = props.align || 'left';
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

    return (
      <th 
        className={`p-2 bg-accent text-accent-foreground font-semibold border border-border ${alignClass}`}
        {...props}
      />
    );
  },
  h1: (props: any) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
  a: ({ node, ...props }: any) => {
    const isBadgeLink = node.children?.some((child: any) =>
      child.type === 'element' && 
      child.tagName === 'img' && 
      (child.properties?.src?.includes('shields.io') ||
       child.properties?.src?.includes('custom-icon-badges'))
    );

    if (isBadgeLink) {
      return (
        <a
          {...props}
          className="inline-block"
          target="_blank"
          rel="noopener noreferrer"
        />
      );
    }

    return (
      <a
        {...props}
        className="text-primary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      />
    );
  },
  pre: (props: any) => (
    <pre className="p-4 bg-accent rounded-lg overflow-x-auto my-4" {...props} />
  ),
  code: ({ inline, ...props }: any) => (
    inline ? 
      <code className="px-1 py-0.5 bg-accent rounded text-sm" {...props} /> :
      <code {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic" {...props} />
  ),
  ul: (props: any) => <ul className="list-disc pl-6 my-4 space-y-1" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 my-4 space-y-1" {...props} />,
  hr: (props: any) => <hr className="my-8 border-t border-border" {...props} />,
  b: (props: any) => <b className="font-semibold" {...props} />,
  strong: (props: any) => <strong className="font-semibold" {...props} />,
};

export default function ReadmeModal({ isOpen, onClose, readme, username }: ReadmeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {username}'s README
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
            {readme ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[
                    [rehypeRaw],
                    [rehypeSanitize, schema],
                  ]}
                  components={components}
                >
                  {readme}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-secondary-foreground text-center py-8">
                No README.md file found for this user.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}