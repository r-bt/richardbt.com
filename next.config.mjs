import withExportImages from 'next-export-optimize-images';
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
    output: 'export',
    distDir: 'out',
};

export default withExportImages(withMDX(nextConfig));
