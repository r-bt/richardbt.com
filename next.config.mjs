import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm'

/** @type {import('next').NextConfig} */
const withMDX = createMDX({
    options: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
    },
})

const nextConfig = {
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

export default withMDX(nextConfig);
