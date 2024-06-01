import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ul: (props) => (
      <ul
        {...props}
        className={`leading-8 ${props.className} list-disc pl-5`}
      />
    ),
    ol: (props) => (
      <ol
        {...props}
        className={`leading-8 ${props.className} list-decimal pl-5 my-2`}
      />
    ),
    p: (props) => (
      <p {...props} className={`leading-8 ${props.className} my-2`} />
    ),
    a: (props) => <a {...props} className={` underline ${props.className}`} />,
    h2: (props) => (
      <h2 {...props} className={`text-2xl font-bold my-4 ${props.className}`} />
    ),
    h3: (props) => (
      <h3 {...props} className={`text-xl font-bold my-3 ${props.className}`} />
    ),
  };
}
