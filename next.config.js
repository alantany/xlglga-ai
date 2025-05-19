/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 其他配置 ...
  
  // 添加以下配置
  experimental: {
    swcLoader: true,
    swcMinify: true,
    // 禁用 pnpm 检查
    pnpm: false
  }
}

module.exports = nextConfig 