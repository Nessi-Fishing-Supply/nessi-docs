/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,

  sassOptions: {
    sourceMap: true,
    includePaths: [path.join(__dirname, 'src/styles')],
  },
};

export default nextConfig;
